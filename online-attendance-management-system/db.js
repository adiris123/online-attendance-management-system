const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection configuration
// Supports DATABASE_URL environment variable (used by Render) or individual connection params
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  // Fallback to individual connection parameters if DATABASE_URL is not set
  ...(process.env.DATABASE_URL ? {} : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'attendance',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  }),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

// Initialize database schema
async function initializeDatabase() {
  try {
    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
    
    // Split schema into individual statements (PostgreSQL doesn't support multi-statement exec like SQLite)
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const statement of statements) {
        if (statement.trim()) {
          await client.query(statement);
        }
      }

      // Lightweight migrations: ensure extra teacher detail columns exist on users table.
      // These ALTERs will fail with "duplicate column name" after the first run; we ignore that.
      const alterStatements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS subject TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS experience TEXT",
      ];

      for (const sql of alterStatements) {
        try {
          await client.query(sql);
        } catch (alterErr) {
          // Ignore "duplicate column" errors
          if (!/already exists/i.test(alterErr.message)) {
            console.error('Migration error:', alterErr.message);
          }
        }
      }

      await client.query('COMMIT');
      console.log('Database schema ensured.');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error applying database schema:', err.message);
    throw err;
  }
}

// Initialize on startup
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Export pool for use in server.js
module.exports = pool;
