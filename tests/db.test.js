// db.test.js
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

describe('Database Tests', () => {
  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('should insert a new service provider', async () => {
    const res = await client.query(
      "INSERT INTO service_providers (name, service) VALUES ($1, $2) RETURNING id",
      ['John Doe', 'Plumber']
    );
    
    expect(res.rows[0].id).toBeDefined();
  });

  it('should fetch service provider details', async () => {
    const res = await client.query('SELECT * FROM service_providers WHERE id = $1', [1]);
    
    expect(res.rows.length).toBeGreaterThan(0);
    expect(res.rows[0].name).toBe('John Doe');
  });
});