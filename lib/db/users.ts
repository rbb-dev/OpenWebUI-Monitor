import { sql } from "@vercel/postgres";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: number;
}

export async function ensureUserTableExists() {
  const tableExists = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'users'
    );
  `;

  if (tableExists.rows[0].exists) {
    await sql`
      ALTER TABLE users 
      ALTER COLUMN balance TYPE DECIMAL(16,6);
    `;
  } else {
    await sql`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        balance DECIMAL(16, 6) NOT NULL
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
    `;
  }
}

export async function getOrCreateUser(
  userData: Omit<User, "balance">
): Promise<User> {
  await ensureUserTableExists();

  const initBalance = Number(process.env.INIT_BALANCE || 1);

  const existingUser = await sql`
    SELECT * FROM users WHERE id = ${userData.id}
  `;

  if (existingUser.rows.length > 0) {
    const result = await sql`
      UPDATE users 
      SET 
        email = ${userData.email},
        name = ${userData.name},
        role = ${userData.role}
      WHERE id = ${userData.id}
      RETURNING *
    `;
    return {
      ...result.rows[0],
      balance: Number(result.rows[0].balance),
    } as User;
  } else {
    const result = await sql`
      INSERT INTO users (id, email, name, role, balance)
      VALUES (
        ${userData.id}, 
        ${userData.email}, 
        ${userData.name}, 
        ${userData.role}, 
        CAST(${initBalance} AS DECIMAL(16,6))
      )
      RETURNING *
    `;
    return {
      ...result.rows[0],
      balance: Number(result.rows[0].balance),
    } as User;
  }
}

export async function updateUserBalance(
  userId: string,
  cost: number
): Promise<number> {
  await ensureUserTableExists();

  console.log("正在更新用户余额:", { userId, cost });

  const currentBalance = await sql`
    SELECT balance FROM users WHERE id = ${userId}
  `;
  console.log("当前余额:", currentBalance.rows[0]?.balance);

  const result = await sql`
    UPDATE users 
    SET balance = (
      CAST(balance AS DECIMAL(16,6)) - 
      CAST(${cost} AS DECIMAL(16,6))
    )
    WHERE id = ${userId}
    RETURNING balance;
  `;

  if (result.rows.length === 0) {
    throw new Error("用户不存在");
  }

  const newBalance = Number(result.rows[0].balance);
  console.log("余额更新完成:", {
    userId,
    cost: cost.toFixed(6),
    oldBalance: currentBalance.rows[0]?.balance,
    newBalance: newBalance.toFixed(6),
    diff: (Number(currentBalance.rows[0]?.balance) - newBalance).toFixed(6),
  });

  return newBalance;
}
