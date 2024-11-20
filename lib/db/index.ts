import { sql } from "@vercel/postgres";
import { ensureUserTableExists } from "./users";

// 创建模型价格表
async function ensureModelPricesTableExists() {
  await sql`
    CREATE TABLE IF NOT EXISTS model_prices (
      model_id TEXT PRIMARY KEY,
      model_name TEXT NOT NULL,
      input_price DECIMAL(10, 6) DEFAULT 0,
      output_price DECIMAL(10, 6) DEFAULT 0
    );
  `;
}

export async function ensureTablesExist() {
  await ensureModelPricesTableExists();
  await ensureUserTableExists();
}

export async function getOrCreateModelPrice(
  modelId: string,
  modelName: string
) {
  const result = await sql`
    INSERT INTO model_prices (model_id, model_name)
    VALUES (${modelId}, ${modelName})
    ON CONFLICT (model_id) DO UPDATE
    SET model_name = ${modelName}
    RETURNING *;
  `;

  return result.rows[0];
}

export * from "./users";
