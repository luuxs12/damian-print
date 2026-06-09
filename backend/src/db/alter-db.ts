import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log("Altering products table to add columns...");
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS labor_cost DOUBLE PRECISION NOT NULL DEFAULT 0.0`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS overhead_cost DOUBLE PRECISION NOT NULL DEFAULT 0.0`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS materials JSONB`;
    console.log("Columns added successfully!");
  } catch (err) {
    console.error("Error adding columns:", err);
  } finally {
    await sql.end();
  }
}

run();
