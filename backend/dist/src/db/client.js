import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
const connectionString = process.env.DATABASE_URL;
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient);
