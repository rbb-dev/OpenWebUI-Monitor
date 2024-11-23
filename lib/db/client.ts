import { Pool } from "pg";
import { sql } from "@vercel/postgres";

// 判断是否在 Vercel 环境
const isVercel = process.env.VERCEL === "1";

// Vercel 环境使用 @vercel/postgres
// Docker 环境使用 node-postgres
export const db = isVercel
  ? sql
  : new Pool({
      host: process.env.POSTGRES_HOST || "db",
      user: process.env.POSTGRES_USER || "postgres",
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE || "openwebui_monitor",
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
    });
