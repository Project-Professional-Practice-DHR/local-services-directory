const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Adjust this path to your actual JSON file
const filePath = path.join(__dirname, '..', 'backend', 'src', 'data', 'users.json');

async function generateAdminUser() {
  try {
    // Load or initialize users array
    let users = [];
    try {
      const data = await fs.readFile(filePath, 'utf8');
      users = JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('📁 users.json not found, creating new file...');
        await fs.writeFile(filePath, '[]');
      } else {
        throw err;
      }
    }

    const existingAdmin = users.find(u => u.role === 'admin');
    if (existingAdmin) {
      console.log(`⚠️ Admin user already exists with ID: ${existingAdmin.id}`);
      return;
    }

    const password = '';
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = {
      id: uuidv4(),
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@professionalpractice.com',
      phoneNumber: '+445551234567',
      password: hashedPassword,
      role: 'admin',
      profilePicture: 'https://i.pinimg.com/736x/a4/c6/43/a4c643313ca80223bf1a38a3f8bed741.jpg',
      isVerified: true,
      status: 'active',
      deviceTokens: '[]',
      devices: '[]',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newAdmin);
    await fs.writeFile(filePath, JSON.stringify(users, null, 2));

    console.log(`✅ Admin user created successfully!`);
    console.log(`🔐 Username: ${newAdmin.username}`);
    console.log(`🔐 Password: ${password}`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  }
}

generateAdminUser();
