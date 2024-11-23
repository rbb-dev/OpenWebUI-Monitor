import {
  createClient,
  QueryResult as VercelQueryResult,
} from "@vercel/postgres";
import { Pool, PoolClient } from "pg";

// 判断是否在 Vercel 环境
const isVercel = process.env.VERCEL === "1";

type DbClient = ReturnType<typeof createClient>;

// 创建一个单例连接
let vercelClient: DbClient | null = null;
let pgPool: Pool | null = null;

function getClient(): DbClient | Pool {
  if (isVercel) {
    if (!vercelClient) {
      vercelClient = createClient();
    }
    return vercelClient;
  } else {
    if (!pgPool) {
      const config = {
        host: process.env.POSTGRES_HOST || "db",
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE || "openwebui_monitor",
        port: parseInt(process.env.POSTGRES_PORT || "5432"),
      };

      // 如果是远程数据库（通过 URL 连接），添加 SSL 配置
      if (process.env.POSTGRES_URL) {
        pgPool = new Pool({
          connectionString: process.env.POSTGRES_URL,
          ssl: {
            rejectUnauthorized: false,
          },
        });
      } else {
        // 本地数据库不需要 SSL
        pgPool = new Pool(config);
      }
    }
    return pgPool;
  }
}

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
  const client = getClient();

  if (isVercel) {
    try {
      // 使用类型断言确保 Vercel 客户端的类型正确
      const result = await (client as DbClient).query({
        text,
        values: params || [],
      });
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      console.error("Vercel DB Query Error:", error);
      throw error;
    }
  } else {
    const pgClient = await (client as Pool).connect();
    try {
      const result = await (pgClient as PoolClient).query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } finally {
      (pgClient as PoolClient).release();
    }
  }
}

// 确保在应用关闭时清理连接
if (typeof window === "undefined") {
  // 仅在服务器端执行
  process.on("SIGTERM", async () => {
    if (pgPool) {
      await pgPool.end();
    }
    if (vercelClient) {
      await (vercelClient as any).end?.();
    }
  });
}
