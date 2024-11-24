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
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };

      if (process.env.POSTGRES_URL) {
        pgPool = new Pool({
          connectionString: process.env.POSTGRES_URL,
          ssl: {
            rejectUnauthorized: false,
          },
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });
      } else {
        pgPool = new Pool(config);
      }

      pgPool.on("error", (err) => {
        console.error("Unexpected error on idle client", err);
        process.exit(-1);
      });
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
  const startTime = Date.now();

  if (isVercel) {
    try {
      console.log(`[DB Query Start] ${text.slice(0, 100)}...`);
      const result = await (client as DbClient).query({
        text,
        values: params || [],
      });
      console.log(`[DB Query Complete] Took ${Date.now() - startTime}ms`);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      console.error("[DB Query Error]", error);
      console.error(`Query text: ${text}`);
      console.error(`Query params:`, params);
      throw error;
    }
  } else {
    let pgClient;
    try {
      pgClient = await (client as Pool).connect();
      console.log(`[DB Query Start] ${text.slice(0, 100)}...`);
      const result = await pgClient.query(text, params);
      console.log(`[DB Query Complete] Took ${Date.now() - startTime}ms`);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      console.error("[DB Query Error]", error);
      console.error(`Query text: ${text}`);
      console.error(`Query params:`, params);
      throw error;
    } finally {
      if (pgClient) {
        pgClient.release();
      }
    }
  }
}

// 确保在应用关闭时清理连接
if (typeof window === "undefined") {
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, closing database connections");
    if (pgPool) {
      await pgPool.end();
    }
    if (vercelClient) {
      await (vercelClient as any).end?.();
    }
  });
}
