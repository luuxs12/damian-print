import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("Running migration: ALTER TABLE quotation_items ADD COLUMN promised_date...");
    await client.query("ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS promised_date TIMESTAMP;");
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
