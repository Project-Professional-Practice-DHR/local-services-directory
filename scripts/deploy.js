#!/usr/bin/env node
// scripts/deploy.js - Deployment script for Local Services Directory
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const config = {
  environments: ['development', 'staging', 'production'],
  defaultEnv: 'development',
  deploymentOptions: [
    { name: 'railway', displayName: 'Railway.app' },
    { name: 'render', displayName: 'Render.com' },
    { name: 'fly', displayName: 'Fly.io' },
    { name: 'local', displayName: 'Local Docker Deployment' },
    { name: 'heroku', displayName: 'Heroku' }
  ]
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Helper function to format output with colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper to print colored output
const print = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}\n${'='.repeat(msg.length)}`),
  options: (options) => {
    console.log(`${colors.blue}Available options:${colors.reset}`);
    options.forEach((opt, index) => {
      console.log(`  ${colors.cyan}${index + 1}.${colors.reset} ${opt}`);
    });
  }
};

// Run Git commands to ensure we're deploying the latest code
const prepareGit = async (environment) => {
  try {
    print.title('Git Status Check');
    
    // Check if git is initialized
    const { stdout: gitStatus } = await execPromise('git status --porcelain');
    
    if (gitStatus.trim() !== '') {
      print.warning('You have uncommitted changes:');
      console.log(gitStatus);
      
      const answer = await question('Do you want to commit these changes before deploying? (y/n): ');
      
      if (answer.toLowerCase() === 'y') {
        const commitMsg = await question(`Enter commit message [Deploying to ${environment}]: `) || `Deploying to ${environment}`;
        
        print.info('Adding all files...');
        await execPromise('git add .');
        
        print.info(`Committing with message: "${commitMsg}"...`);
        await execPromise(`git commit -m "${commitMsg}"`);
        
        print.success('Changes committed successfully');
      } else {
        print.warning('Continuing with uncommitted changes');
      }
    } else {
      print.success('Git working directory is clean');
    }
    
    // Check current branch
    const { stdout: currentBranch } = await execPromise('git rev-parse --abbrev-ref HEAD');
    print.info(`Current branch: ${currentBranch.trim()}`);
    
    // If not on the target environment branch, ask to switch
    if (currentBranch.trim() !== environment && config.environments.includes(environment)) {
      const answer = await question(`You're not on the ${environment} branch. Do you want to switch? (y/n): `);
      
      if (answer.toLowerCase() === 'y') {
        // Check if the branch exists
        const { stdout: branches } = await execPromise('git branch');
        const branchExists = branches.includes(environment);
        
        if (branchExists) {
          print.info(`Switching to ${environment} branch...`);
          await execPromise(`git checkout ${environment}`);
        } else {
          print.info(`Creating and switching to ${environment} branch...`);
          await execPromise(`git checkout -b ${environment}`);
        }
        
        print.success(`Switched to ${environment} branch`);
      } else {
        print.warning(`Continuing deployment from ${currentBranch.trim()} branch`);
      }
    }
    
    return true;
  } catch (error) {
    print.error(`Git preparation failed: ${error.message}`);
    return false;
  }
};

// Build the application
const buildApp = async () => {
  try {
    print.title('Building Application');
    
    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found. Are you in the project root directory?');
    }
    
    // Install dependencies
    print.info('Installing dependencies...');
    await execPromise('npm ci');
    
    // Run build script if it exists
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.build) {
      print.info('Running build script...');
      await execPromise('npm run build');
    } else {
      print.warning('No build script found in package.json, skipping build step');
    }
    
    // Run tests
    if (packageJson.scripts && packageJson.scripts.test) {
      print.info('Running tests...');
      try {
        await execPromise('npm test');
        print.success('Tests passed successfully');
      } catch (error) {
        print.error('Tests failed');
        const answer = await question('Do you want to continue with deployment despite test failures? (y/n): ');
        if (answer.toLowerCase() !== 'y') {
          throw new Error('Deployment aborted due to test failures');
        }
      }
    } else {
      print.warning('No test script found in package.json, skipping tests');
    }
    
    print.success('Application built successfully');
    return true;
  } catch (error) {
    print.error(`Build failed: ${error.message}`);
    return false;
  }
};

// Deploy to Railway.app
const deployToRailway = async (environment) => {
  try {
    print.title('Deploying to Railway.app');
    
    // Check if Railway CLI is installed
    try {
      await execPromise('railway --version');
    } catch (error) {
      print.error('Railway CLI not found. Please install it with: npm i -g @railway/cli');
      return false;
    }
    
    // Link to the correct project if needed
    print.info('Checking Railway project...');
    try {
      const { stdout } = await execPromise('railway status');
      print.info(`Current Railway project: ${stdout.split('\n')[0]}`);
    } catch (error) {
      print.warning('Not linked to a Railway project');
      print.info('Linking to Railway project...');
      await execPromise('railway link');
    }
    
    // Deploy to Railway
    print.info(`Deploying to Railway (${environment})...`);
    await execPromise(`railway up --environment ${environment}`);
    
    print.success('Deployed to Railway successfully');
    return true;
  } catch (error) {
    print.error(`Railway deployment failed: ${error.message}`);
    return false;
  }
};

// Deploy to Render.com
const deployToRender = async (environment) => {
  try {
    print.title('Deploying to Render.com');
    
    // Render uses GitHub integration - just push to the right branch
    print.info(`Pushing to ${environment} branch...`);
    await execPromise(`git push origin ${environment}`);
    
    print.success('Code pushed to GitHub. Render will automatically deploy');
    print.info('Note: You need to set up a Render service connected to your GitHub repository');
    print.info('Visit https://dashboard.render.com to check deployment status');
    
    return true;
  } catch (error) {
    print.error(`Render deployment failed: ${error.message}`);
    return false;
  }
};

// Deploy to Fly.io
const deployToFly = async (environment) => {
  try {
    print.title('Deploying to Fly.io');
    
    // Check if Fly CLI is installed
    try {
      await execPromise('fly version');
    } catch (error) {
      print.error('Fly CLI not found. Please install it from https://fly.io/docs/hands-on/install-flyctl/');
      return false;
    }
    
    // Check if fly.toml exists
    if (!fs.existsSync('fly.toml')) {
      print.warning('fly.toml not found. Running fly launch to set up app...');
      await execPromise('fly launch');
    }
    
    // Deploy to Fly
    print.info(`Deploying to Fly.io (${environment})...`);
    await execPromise(`fly deploy --config fly.${environment}.toml`);
    
    print.success('Deployed to Fly.io successfully');
    return true;
  } catch (error) {
    print.error(`Fly.io deployment failed: ${error.message}`);
    return false;
  }
};

// Deploy using Docker locally
const deployLocal = async (environment) => {
  try {
    print.title('Deploying Locally with Docker');
    
    // Check if Docker is installed
    try {
      await execPromise('docker --version');
    } catch (error) {
      print.error('Docker not found. Please install Docker from https://docs.docker.com/get-docker/');
      return false;
    }
    
    // Copy the appropriate .env file
    const envFile = `.env.${environment}`;
    
    if (fs.existsSync(envFile)) {
      print.info(`Copying ${envFile} to .env...`);
      fs.copyFileSync(envFile, '.env');
    } else {
      print.warning(`${envFile} not found. Make sure your environment variables are properly set.`);
    }
    
    // Build and run with Docker Compose
    print.info('Building Docker images...');
    await execPromise('docker-compose build');
    
    print.info('Starting Docker containers...');
    await execPromise('docker-compose up -d');
    
    print.success('Local deployment with Docker completed successfully');
    print.info('Your application is now running at: http://localhost:5001');
    print.info('To stop the containers, run: docker-compose down');
    
    return true;
  } catch (error) {
    print.error(`Local Docker deployment failed: ${error.message}`);
    return false;
  }
};

// Deploy to Heroku
const deployToHeroku = async (environment) => {
  try {
    print.title('Deploying to Heroku');
    
    // Check if Heroku CLI is installed
    try {
      await execPromise('heroku --version');
    } catch (error) {
      print.error('Heroku CLI not found. Please install it from https://devcenter.heroku.com/articles/heroku-cli');
      return false;
    }
    
    // Check if we're logged in
    try {
      await execPromise('heroku auth:whoami');
    } catch (error) {
      print.warning('Not logged in to Heroku');
      print.info('Please log in to Heroku...');
      await execPromise('heroku login');
    }
    
    // Check if app exists
    let appName = `local-services-${environment}`;
    try {
      await execPromise(`heroku apps:info --app ${appName}`);
      print.info(`Using existing Heroku app: ${appName}`);
    } catch (error) {
      print.warning(`Heroku app '${appName}' not found`);
      
      const createApp = await question('Would you like to create a new Heroku app? (y/n): ');
      if (createApp.toLowerCase() === 'y') {
        print.info('Creating new Heroku app...');
        const { stdout } = await execPromise(`heroku apps:create ${appName}`);
        print.success(`Created Heroku app: ${stdout.split('\n')[0]}`);
      } else {
        appName = await question('Enter existing Heroku app name: ');
        if (!appName) {
          throw new Error('No app name provided, deployment aborted');
        }
      }
    }
    
    // Set environment variables
    if (fs.existsSync(`.env.${environment}`)) {
      print.info('Setting environment variables from .env file...');
      const envContent = fs.readFileSync(`.env.${environment}`, 'utf8');
      const envVars = envContent.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.trim());
      
      for (const line of envVars) {
        if (line) {
          const [key, value] = line.split('=');
          if (key && value) {
            try {
              await execPromise(`heroku config:set ${key}=${value} --app ${appName}`);
              print.info(`Set ${key} environment variable`);
            } catch (error) {
              print.error(`Failed to set ${key}: ${error.message}`);
            }
          }
        }
      }
    }
    
    // Add PostgreSQL addon if needed
    try {
      await execPromise(`heroku addons:info postgresql --app ${appName}`);
      print.info('PostgreSQL addon already attached');
    } catch (error) {
      print.warning('PostgreSQL addon not found');
      
      const addPostgres = await question('Would you like to add the Heroku PostgreSQL addon? (y/n): ');
      if (addPostgres.toLowerCase() === 'y') {
        print.info('Adding PostgreSQL addon...');
        await execPromise(`heroku addons:create heroku-postgresql:hobby-dev --app ${appName}`);
        print.success('PostgreSQL addon added successfully');
      }
    }
    
    // Push to Heroku
    print.info('Deploying to Heroku...');
    await execPromise(`git push heroku \`git rev-parse --abbrev-ref HEAD\`:main`);
    
    print.success('Deployed to Heroku successfully');
    print.info(`Your application is now running at: https://${appName}.herokuapp.com`);
    
    return true;
  } catch (error) {
    print.error(`Heroku deployment failed: ${error.message}`);
    return false;
  }
};

// Main deployment function
const deploy = async () => {
  try {
    print.title('Local Services Directory Deployment Tool');
    
    // Select environment
    print.options(config.environments);
    const envIndex = await question(`Select deployment environment (1-${config.environments.length}) [default: ${config.defaultEnv}]: `);
    
    const environment = config.environments[parseInt(envIndex, 10) - 1] || config.defaultEnv;
    print.info(`Selected environment: ${environment}`);
    
    // Select deployment target
    print.options(config.deploymentOptions.map(opt => opt.displayName));
    const targetIndex = await question(`Select deployment target (1-${config.deploymentOptions.length}): `);
    
    if (!targetIndex || isNaN(parseInt(targetIndex, 10)) || parseInt(targetIndex, 10) < 1 || parseInt(targetIndex, 10) > config.deploymentOptions.length) {
      throw new Error('Invalid deployment target selection');
    }
    
    const deploymentTarget = config.deploymentOptions[parseInt(targetIndex, 10) - 1];
    print.info(`Selected deployment target: ${deploymentTarget.displayName}`);
    
    // Prepare git repository
    const gitPrepared = await prepareGit(environment);
    if (!gitPrepared) {
      throw new Error('Git preparation failed');
    }
    
    // Build application
    const buildSuccess = await buildApp();
    if (!buildSuccess) {
      throw new Error('Application build failed');
    }
    
    // Run deployment based on selected target
    let deploymentSuccess = false;
    
    switch (deploymentTarget.name) {
      case 'railway':
        deploymentSuccess = await deployToRailway(environment);
        break;
      case 'render':
        deploymentSuccess = await deployToRender(environment);
        break;
      case 'fly':
        deploymentSuccess = await deployToFly(environment);
        break;
      case 'local':
        deploymentSuccess = await deployLocal(environment);
        break;
      case 'heroku':
        deploymentSuccess = await deployToHeroku(environment);
        break;
      default:
        throw new Error(`Unknown deployment target: ${deploymentTarget.name}`);
    }
    
    if (deploymentSuccess) {
      print.title('Deployment Completed Successfully');
      print.success(`${deploymentTarget.displayName} deployment to ${environment} environment completed!`);
    } else {
      throw new Error(`Deployment to ${deploymentTarget.displayName} failed`);
    }
    
  } catch (error) {
    print.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Run the deployment if this script is executed directly
if (require.main === module) {
  deploy();
}

module.exports = { deploy };