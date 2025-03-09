// auth.test.js
const request = require('supertest');
const app = require('../backend/server.js'); // Your Express app
const jwt = require('jsonwebtoken');

let token;

beforeAll(async () => {
  // Log in a test user and retrieve the token
  const res = await request(app)
    .post('/login')
    .send({ username: 'testuser', password: 'password123' });

  token = res.body.token;
});

describe('Protected Routes', () => {
  it('should allow access to protected routes with valid token', async () => {
    const res = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testuser');
  });

  it('should deny access to protected routes without token', async () => {
    const res = await request(app).get('/profile');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('No token provided');
  });

  it('should deny access with invalid token', async () => {
    const res = await request(app)
      .get('/profile')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Invalid token');
  });
});