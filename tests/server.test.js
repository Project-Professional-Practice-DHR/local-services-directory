// server.test.js
const request = require('supertest');
const app = require('../app'); // Your Express app

describe('POST /upload', () => {
  it('should upload a file and return success', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', './path_to_your_file.jpeg'); // File path to upload
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('File uploaded successfully!');
    expect(res.body.fileId).toBeDefined();
  });

  it('should return error if no file is uploaded', async () => {
    const res = await request(app)
      .post('/upload');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No file uploaded');
  });
});