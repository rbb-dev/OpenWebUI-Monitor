import { createPool } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// 创建连接池 - 使用 POSTGRES_URL_NON_POOLING 用于直接连接
// 使用 POSTGRES_URL 用于连接池
const pool = createPool({
  connectionString: process.env.POSTGRES_URL?.replace(
    "postgres://",
    "postgres://pooler:"
  ),
});

// 添加连接测试
const testConnection = async () => {
  try {
    const { rows } = await pool.query("SELECT NOW()");
    console.log("数据库连接成功:", rows[0]);
  } catch (err) {
    console.error("数据库连接失败:", err);
  }
};

testConnection();

// 定义数据表结构
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 导出数据库实例
export const db = drizzle(pool);
