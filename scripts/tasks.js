const { Octokit } = require("@octokit/rest");
const { graphql } = require("@octokit/graphql");

// Configure these values
const GITHUB_TOKEN = "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";
const OWNER = "ritiksah141";
const REPO = "local-services-directory";
const PROJECT_NUMBER = 1; // Your project number

// Initialize Octokit with your GitHub token
const octokit = new Octokit({
  auth: GITHUB_TOKEN
});

// Initialize GraphQL client for Projects v2
const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`
  }
});

// Backend tasks to add
const tasks = [
  {
    title: "Database Schema Design",
    body: `- Create tables for users (with different roles: customers, service providers, admins)
- Design tables for services, categories, and subcategories
- Set up booking/appointment tables
- Create tables for reviews and ratings
- Design payment and transaction tables
- Set up messaging/communication tables
- Establish relationships between tables`
  },
  {
    title: "API Development: User Management",
    body: `- Authentication routes (register, login, logout)
- Profile management endpoints
- Role-based authorization middleware`
  },
  {
    title: "API Development: Service Provider Management",
    body: `- CRUD operations for service provider profiles
- Service listing management
- Availability and scheduling APIs
- Portfolio/work history endpoints
- Verification process API`
  },
  {
    title: "API Development: Search & Discovery",
    body: `- Category-based search endpoints
- Location-based search with distance calculations
- Keyword search functionality
- Filter implementation (ratings, price, experience)`
  },
  {
    title: "API Development: Booking System",
    body: `- Appointment scheduling endpoints
- Availability checking
- Confirmation and notification triggers
- Rescheduling and cancellation handlers`
  },
  {
    title: "API Development: Payment System",
    body: `- Integration with payment gateways (Stripe/PayPal)
- Transaction record management
- Invoice generation
- Commission/fee calculation`
  },
  {
    title: "API Development: Review & Rating System",
    body: `- Submit review endpoints
- Verified review validation
- Provider response functionality`
  },
  {
    title: "API Development: Maps & Location",
    body: `- Google Maps API integration
- Geocoding for service provider locations
- Distance calculation endpoints`
  },
  {
    title: "API Development: Communication",
    body: `- Messaging API
- Notification system (email/SMS)
- Push notification setup`
  },
  {
    title: "API Development: Admin Dashboard",
    body: `- User management endpoints
- Reporting and analytics APIs
- Content moderation endpoints`
  },
  {
    title: "Security Implementation",
    body: `- JWT or session-based authentication
- Password encryption
- Data validation and sanitization
- Rate limiting
- CORS configuration
- Protection against common vulnerabilities (XSS, CSRF, SQL injection)`
  },
  {
    title: "Integration Services",
    body: `- Email service integration (SendGrid, Mailgun, etc.)
- SMS service integration (Twilio, etc.)
- Payment gateway integration
- Google Maps API integration
- Cloud storage for images/files`
  },
  {
    title: "Testing",
    body: `- Unit tests for API endpoints
- Integration tests
- Database query testing
- Authentication/authorization testing
- Load testing`
  },
  {
    title: "Deployment & DevOps",
    body: `- CI/CD pipeline setup
- Environment configuration (dev, staging, production)
- Logging and monitoring setup
- Error handling and reporting
- Database backup strategies`
  }
];

async function main() {
  try {
    // First get the Project ID
    const projectData = await graphqlWithAuth(`
      query {
        user(login: "${OWNER}") {
          projectV2(number: ${PROJECT_NUMBER}) {
            id
            title
          }
        }
      }
    `);
    
    // If project not found at user level, try organization level
    let projectId;
    try {
      projectId = projectData.user.projectV2.id;
      console.log(`Found project: ${projectData.user.projectV2.title}`);
    } catch (error) {
      // Project might be at organization level or not exist
      console.log("Project not found at user level, trying repository level...");
      
      const repoProjectData = await graphqlWithAuth(`
        query {
          repository(owner: "${OWNER}", name: "${REPO}") {
            projectV2(number: ${PROJECT_NUMBER}) {
              id
              title
            }
          }
        }
      `);
      
      projectId = repoProjectData.repository.projectV2.id;
      console.log(`Found project: ${repoProjectData.repository.projectV2.title}`);
    }
    
    if (!projectId) {
      console.error(`Project #${PROJECT_NUMBER} not found`);
      return;
    }
    
    console.log(`Adding ${tasks.length} issues to the repository and project...`);
    
    // Create issues and add them to the project
    for (const task of tasks) {
      // Create a new issue
      const issueResponse = await octokit.rest.issues.create({
        owner: OWNER,
        repo: REPO,
        title: task.title,
        body: task.body,
      });
      
      const issueId = issueResponse.data.node_id;
      console.log(`Created issue: ${task.title}`);
      
      // Add the issue to the project
      await graphqlWithAuth(`
        mutation {
          addProjectV2ItemById(input: {
            projectId: "${projectId}"
            content_id: "${issueId}"
          }) {
            item {
              id
            }
          }
        }
      `);
      
      console.log(`Added issue to project: ${task.title}`);
    }
    
    console.log("All tasks added successfully!");
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.errors) {
      console.error("GraphQL Errors:", JSON.stringify(error.errors, null, 2));
    }
  }
}

main();