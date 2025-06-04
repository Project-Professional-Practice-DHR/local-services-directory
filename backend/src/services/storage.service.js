const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, PDFs, and common document formats
    const allowedFileTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and common document formats are allowed.'));
    }
  }
});

// Generate a unique filename
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  const extension = path.extname(originalName);
  return `${timestamp}-${randomString}${extension}`;
};

// Upload file to S3
const uploadFile = async (file, folder = 'uploads') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }
    
    const filename = generateUniqueFilename(file.originalname);
    const key = `${folder}/${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      content_type: file.mimetype,
      ACL: 'public-read'
    });
    
    await s3Client.send(command);
    
    // Return file URL
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    
    return {
      key,
      url: fileUrl,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    };
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};

// Delete file from S3
const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    });
    
    await s3Client.send(command);
    
    return { success: true };
  } catch (error) {
    console.error('File deletion failed:', error);
    throw error;
  }
};

// Generate a signed URL for temporary file access
const getSignedFileUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return { url };
  } catch (error) {
    console.error('Signed URL generation failed:', error);
    throw error;
  }
};

module.exports = {
  upload,
  uploadFile,
  deleteFile,
  getSignedFileUrl
};