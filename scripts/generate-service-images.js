const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const JSON_FILE_PATH = '/Users/ritiksah/Downloads/local-services-directory 5/backend/src/data/services.json';
const IMAGES_DIR = '/Users/ritiksah/Downloads/local-services-directory 5/frontend/src/images';
const DEFAULT_IMAGE_URL = 'https://placehold.co/600x400?text=Service+Image';

// Image URLs for each service
const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952', // 1. Professional Home Cleaning
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4', // 2. Expert Electrical Repairs
  'https://images.unsplash.com/photo-1606274141130-18a76dd7629c', // 3. Comprehensive Plumbing Solutions
  'https://images.unsplash.com/photo-1581239125393-67d48d3dd429', // 4. Master Handyman Services
  'https://images.unsplash.com/photo-1562259949-e8e7689d7828', // 5. Professional Painting Services
  'https://images.unsplash.com/photo-1608613304899-ea8098577e38', // 6. Expert Carpentry Solutions
  'https://images.unsplash.com/photo-1589923188900-85dae523342b', // 7. Professional Lawn Care
  'https://images.unsplash.com/photo-1631700611307-37dbcb89ef7e', // 8. Residential HVAC Services
  'https://images.unsplash.com/photo-1607435156392-c0ee58d1c329', // 9. Professional Locksmith
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d', // 10. Window Cleaning Service
  'https://images.unsplash.com/photo-1632759145357-b9310104578a', // 11. Roofing Repair & Installation
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6', // 12. Interior Design Consultation
  'https://images.unsplash.com/photo-1581092921461-7031e1940327', // 13. Appliance Repair Services
  'https://images.unsplash.com/photo-1636556493814-1a1562797768', // 14. Pest Control Services
  'https://images.unsplash.com/photo-1600518464441-9154a4dea21b', // 15. Moving Services
  'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b', // 16. Computer Repair Services
  'https://images.unsplash.com/photo-1604347076665-377bc9ad7b68', // 17. Drywall Installation & Repair
  'https://images.unsplash.com/photo-1607860108855-64acf2078ed9', // 18. Professional Car Detailing
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32', // 19. Professional Photography
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace', // 20. Flooring Installation Services
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b', // 21. Personal Training
  'https://images.unsplash.com/photo-1622372738946-62e2b471515a', // 22. Gutter Cleaning & Repair
  'https://images.unsplash.com/photo-1558002038-1055907df827', // 23. Home Security Installation
  'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd', // 24. Pool Cleaning & Maintenance
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a', // 25. Home Organizing Services
  'https://images.unsplash.com/photo-1598458255717-50224f810376', // 26. Tree Trimming & Removal
  'https://images.unsplash.com/photo-1635348118257-77bf8abcb097', // 27. Catering Services
  'https://images.unsplash.com/photo-1578776375248-da989088c634', // 28. Fence Installation & Repair
  'https://images.unsplash.com/photo-1519741497674-611481863552', // 29. Wedding Planning Services
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b', // 30. Tutoring Services
  'https://images.unsplash.com/photo-1600334129128-685c5582fd35', // 31. Massage Therapy
  'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd', // 32. Dog Walking & Pet Sitting
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4', // 33. Resume Writing Services
  'https://images.unsplash.com/photo-1584622781564-1d987f7333c1', // 34. Upholstery Cleaning
  'https://images.unsplash.com/photo-1509391366360-2e959784a276', // 35. Solar Panel Installation
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c', // 36. Personal Chef Services
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f', // 37. Tax Preparation Services
  'https://images.unsplash.com/photo-1595079676339-1534801ad6cf', // 38. Furniture Assembly Service
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0', // 39. Lawn Irrigation Services
  'https://images.unsplash.com/photo-1600607687644-a8cfb7406d92', // 40. Home Staging Services
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8', // 41. Language Translation Services
  'https://images.unsplash.com/photo-1542362567-b07e54358753', // 42. Mobile Car Wash
  'https://images.unsplash.com/photo-1620626011949-78e8bb854ea3', // 43. Closet Organization & Design
  'https://images.unsplash.com/photo-1593784991095-a205069470b6', // 44. Audio-Visual Installation
  'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b', // 45. Private Yoga Instruction
  'https://images.unsplash.com/photo-1585421514738-01798e348b17', // 46. Home Appliance Installation
  'https://images.unsplash.com/photo-1580136579312-94651dfd596d', // 47. Art Installation Services
  'https://images.unsplash.com/photo-1610687384950-ded3aa93fb2b', // 48. Chimney Cleaning & Inspection
  'https://images.unsplash.com/photo-1557939574-a2cb399f443f', // 49. Baby Proofing Services
  'https://images.unsplash.com/photo-1607262807149-dfd4c39320a6'  // 50. Holiday Light Installation
];

// Create images directory if it doesn't exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log(`Created directory: ${IMAGES_DIR}`);
}

// Function to download an image
async function downloadImage(url, filename) {
  try {
    // Create full path for the image
    const imagePath = path.join(IMAGES_DIR, filename);
    
    let response;
    try {
      // Try to download the image
      response = await axios.get(url, { responseType: 'arraybuffer' });
    } catch (error) {
      console.log(`Failed to download image from ${url}, using placeholder instead.`);
      // Use a placeholder image instead
      response = await axios.get(DEFAULT_IMAGE_URL, { responseType: 'arraybuffer' });
    }
    
    // Write the image to disk
    fs.writeFileSync(imagePath, response.data);
    console.log(`Downloaded image: ${filename}`);
    
    // Return the relative path for use in the app
    return `/images/${filename}`;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error.message);
    return null;
  }
}

// Main function to download all images and update JSON
async function downloadAllImages() {
  try {
    // Read the JSON file
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf8'));
    
    // Check if we have the expected structure
    if (!jsonData.services) {
      throw new Error('Invalid JSON format: Expected services array');
    }
    
    console.log(`Found ${jsonData.services.length} services in JSON file.`);
    
    // Process each service
    for (let i = 0; i < jsonData.services.length; i++) {
      const service = jsonData.services[i];
      
      // Use the index to get the corresponding image URL from our array
      // Adjust for 1-based ID vs 0-based array index
      const serviceId = parseInt(service.id);
      const imageUrl = IMAGE_URLS[serviceId - 1] || DEFAULT_IMAGE_URL;
      
      // Generate a unique filename for the image
      const extension = '.jpg'; // Default to jpg for Unsplash images
      const filename = `service-${service.id}${extension}`;
      
      console.log(`Processing service ${i+1}/${jsonData.services.length}: ${service.name}`);
      console.log(`Using image URL: ${imageUrl}`);
      
      // Download the image
      const localPath = await downloadImage(imageUrl, filename);
      
      if (localPath) {
        // Store the original image URL
        jsonData.services[i].originalImage = service.image;
        // Update the JSON with the new local path
        jsonData.services[i].image = localPath;
      }
    }
    
    // Write the updated JSON back to the file
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(jsonData, null, 2));
    console.log(`Updated JSON file with local image paths.`);
    
    console.log('All images downloaded successfully!');
  } catch (error) {
    console.error('Error downloading images:', error);
  }
}

// Run the main function
downloadAllImages();