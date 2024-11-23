import { createClient } from "@vercel/postgres";
import { Pool, QueryResult } from "pg";

// 判断是否在 Vercel 环境
const isVercel = process.env.VERCEL === "1";

// Vercel 环境使用 @vercel/postgres 的 createClient
// Docker 环境使用 node-postgres
export const db = isVercel
  ? createClient()
  : new Pool({
      host: process.env.POSTGRES_HOST || "db",
      user: process.env.POSTGRES_USER || "postgres",
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE || "openwebui_monitor",
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
    });

// 定义一个通用的查询结果类型
type CommonQueryResult<T = any> = {
  rows: T[];
  rowCount: number;
};

// 导出一个通用的查询函数
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<CommonQueryResult<T>> {
  if (isVercel) {
    // Vercel 环境
    const result = await (db as any).query(text, params || []);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  } else {
    // Docker 环境
    const client = await (db as Pool).connect();
    try {
      const result = await client.query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } finally {
      client.release();
    }
  }
}
