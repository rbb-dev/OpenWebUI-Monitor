import { sql } from "@vercel/postgres";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: number;
}

export async function ensureUserTableExists() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      balance DECIMAL(10, 2) NOT NULL,
      INDEX email_idx (email)
    );
  `;
}

export async function getOrCreateUser(
  userData: Omit<User, "balance">
): Promise<User> {
  const initBalance = Number(process.env.INIT_BALANCE || 1);

  const result = await sql`
    INSERT INTO users (id, email, name, role, balance)
    VALUES (${userData.id}, ${userData.email}, ${userData.name}, ${userData.role}, ${initBalance})
    ON CONFLICT (id) 
    DO UPDATE SET 
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = EXCLUDED.role
    RETURNING *;
  `;

  return result.rows[0] as User;
}
