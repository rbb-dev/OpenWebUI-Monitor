import { NextResponse } from "next/server";
import { encode } from "gpt-tokenizer/model/gpt-4";
import { Pool, PoolClient } from "pg";
import { createClient } from "@vercel/postgres";
import { query, getClient } from "@/lib/db/client";
import { updateUserBalance } from "@/lib/db/users";
import { ensureTablesExist } from "@/lib/db";

const isVercel = process.env.VERCEL === "1";

interface Message {
  role: string;
  content: string;
}

interface ModelPrice {
  id: string;
  name: string;
  input_price: number;
  output_price: number;
}

type DbClient = ReturnType<typeof createClient> | Pool | PoolClient;

async function getModelPrice(modelId: string): Promise<ModelPrice | null> {
  const result = await query(
    `SELECT id, name, input_price, output_price 
     FROM model_prices 
     WHERE id = $1`,
    [modelId]
  );
  return result.rows[0] || null;
}

export async function POST(req: Request) {
  const client = (await getClient()) as DbClient;
  let pgClient: DbClient | null = null;

  try {
    // 获取专用的事务客户端
    if (isVercel) {
      pgClient = client;
    } else {
      pgClient = await (client as Pool).connect();
    }

    const data = await req.json();
    const modelId = data.body.model;
    const userId = data.user.id;
    const userName = data.user.name || "Unknown User";

    // 开启事务
    await query("BEGIN");

    // 获取模型价格
    const modelPrice = await getModelPrice(modelId);
    if (!modelPrice) {
      throw new Error(`未找到模型 ${modelId} 的价格信息`);
    }

    // 计算 tokens
    const lastMessage = data.body.messages[data.body.messages.length - 1];
    const outputTokens = encode(lastMessage.content).length;
    const totalTokens = data.body.messages.reduce(
      (sum: number, msg: Message) => sum + encode(msg.content).length,
      0
    );
    const inputTokens = totalTokens - outputTokens;

    // 计算成本
    const inputCost = (inputTokens / 1_000_000) * modelPrice.input_price;
    const outputCost = (outputTokens / 1_000_000) * modelPrice.output_price;
    const totalCost = inputCost + outputCost;

    // 获取并更新用户余额
    const userResult = await query(
      `UPDATE users 
       SET balance = balance - $1
       WHERE id = $2
       RETURNING balance`,
      [totalCost, userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error("用户不存在");
    }

    const newBalance = Number(userResult.rows[0].balance);

    // 记录使用情况
    await query(
      `INSERT INTO user_usage_records (
        user_id, nickname, model_name, 
        input_tokens, output_tokens, 
        cost, balance_after
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        userName,
        modelId,
        inputTokens,
        outputTokens,
        totalCost,
        newBalance,
      ]
    );

    await query("COMMIT");

    return NextResponse.json({
      success: true,
      inputTokens,
      outputTokens,
      totalCost,
      newBalance,
      message: "请求成功",
    });
  } catch (error) {
    await query("ROLLBACK");
    console.error("Outlet error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "处理请求时发生错误",
        error_type: error instanceof Error ? error.name : "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  } finally {
    // 只在非 Vercel 环境下释放连接
    if (!isVercel && pgClient && "release" in pgClient) {
      pgClient.release();
    }
  }
}
