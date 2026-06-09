require('dotenv').config();
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const sqlPath = path.join(__dirname, 'drizzle', '0013_add_quotations.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split statements by statement-breakpoint
    const statements = sqlContent.split('--> statement-breakpoint');
    
    console.log(`Executing ${statements.length} migration statements...`);
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (trimmed) {
        console.log(`Executing: ${trimmed.substring(0, 100)}...`);
        await sql.unsafe(trimmed);
      }
    }
    console.log('Migration executed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

main();
