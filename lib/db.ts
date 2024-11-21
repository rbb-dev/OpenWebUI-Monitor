import { Pool, PoolClient } from "pg";

// 构建数据库连接配置
const dbConfig = process.env.POSTGRES_URL
  ? {
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      ssl: { rejectUnauthorized: false },
    };

const pool = new Pool(dbConfig);

// 测试连接
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export interface ModelPrice {
  id: string;
  name: string;
  input_price: number;
  output_price: number;
  updated_at: Date;
}

export interface UserUsageRecord {
  id: number;
  userId: number;
  nickname: string;
  useTime: Date;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  balanceAfter: number;
}

// 确保表存在
export async function ensureTablesExist() {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // 首先创建 model_prices 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS model_prices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        input_price DOUBLE PRECISION NOT NULL DEFAULT 60,
        output_price DOUBLE PRECISION NOT NULL DEFAULT 60,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 然后创建 user_usage_records 表，注意 user_id 类型改为 TEXT
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_usage_records (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        nickname VARCHAR(255) NOT NULL,
        use_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        model_name VARCHAR(255) NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cost DECIMAL(10, 4) NOT NULL,
        balance_after DECIMAL(10, 4) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    console.log("确保用户使用记录表已创建");
  } catch (error) {
    console.error("Database connection/initialization error:", error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// 获取模型价格，如果不存在则创建默认值
export async function getOrCreateModelPrice(
  id: string,
  name: string
): Promise<ModelPrice> {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query<ModelPrice>(
      `INSERT INTO model_prices (id, name, input_price, output_price)
       VALUES ($1, $2, 60, 60)
       ON CONFLICT (id) DO UPDATE SET name = $2
       RETURNING *`,
      [id, name]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error in getOrCreateModelPrice:", error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// 更新模型价格
export async function updateModelPrice(
  id: string,
  input_price: number,
  output_price: number
): Promise<ModelPrice | null> {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query<ModelPrice>(
      `UPDATE model_prices 
       SET input_price = $2, 
           output_price = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, input_price, output_price]
    );
    return result.rows[0] || null; // 如果没有找到记录，返回 null
  } catch (error) {
    console.error("Error in updateModelPrice:", error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// 添加一个初始化函数
export async function initDatabase() {
  try {
    await ensureTablesExist();
    // console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
