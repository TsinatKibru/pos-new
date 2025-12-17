const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Connected successfully!');

    console.log('Database connection is ready.');
    console.log('Schema will be initialized automatically via Docker on first startup.');

  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
