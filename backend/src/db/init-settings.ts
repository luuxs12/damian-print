import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

const run = async () => {
  console.log("Initializing settings table...");
  const sql = postgres(connectionString);
  try {
    // 1. Create table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL DEFAULT 'Damian Print',
        company_ruc TEXT NOT NULL DEFAULT '',
        company_email TEXT NOT NULL DEFAULT '',
        company_phone TEXT NOT NULL DEFAULT '',
        company_address TEXT NOT NULL DEFAULT '',
        system_logo TEXT,
        yape_qr TEXT,
        plin_qr TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("Table 'settings' verified/created.");

    // 2. Insert default row if not exists
    const [existing] = await sql`SELECT id FROM settings WHERE id = 1`;
    if (!existing) {
      await sql`
        INSERT INTO settings (id, company_name, company_ruc, company_email, company_phone, company_address, system_logo, yape_qr, plin_qr)
        VALUES (
          1,
          'Damian Print',
          '20123456789',
          'contacto@damianprint.com',
          '987654321',
          'Av. Larco 123, Miraflores',
          NULL,
          NULL,
          NULL
        )
      `;
      console.log("Default settings row (id=1) inserted.");
    } else {
      console.log("Default settings row already exists.");
    }
  } catch (error) {
    console.error("Error creating/initializing settings table:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
};

run();
