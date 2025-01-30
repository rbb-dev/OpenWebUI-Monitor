import { NextResponse } from "next/server";
import { encode } from "gpt-tokenizer/model/gpt-4";
import { Pool, PoolClient } from "pg";
import { createClient } from "@vercel/postgres";
import { query, getClient } from "@/lib/db/client";

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
  per_msg_price: number;
}

type DbClient = ReturnType<typeof createClient> | Pool | PoolClient;

async function getModelPrice(modelId: string): Promise<ModelPrice | null> {
  const result = await query(
    `SELECT id, name, input_price, output_price, per_msg_price 
     FROM model_prices 
     WHERE id = $1`,
    [modelId]
  );

  if (result.rows[0]) {
    return result.rows[0];
  }

  // 如果数据库中没有找到价格，使用默认价格
  const defaultInputPrice = parseFloat(
    process.env.DEFAULT_MODEL_INPUT_PRICE || "60"
  );
  const defaultOutputPrice = parseFloat(
    process.env.DEFAULT_MODEL_OUTPUT_PRICE || "60"
  );

  // 验证默认价格是否为有效的非负数
  if (
    isNaN(defaultInputPrice) ||
    defaultInputPrice < 0 ||
    isNaN(defaultOutputPrice) ||
    defaultOutputPrice < 0
  ) {
    return null;
  }

  return {
    id: modelId,
    name: modelId,
    input_price: defaultInputPrice,
    output_price: defaultOutputPrice,
    per_msg_price: -1, // 默认使用按 token 计费
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userName, modelId, inputTokens, outputTokens } = body;

    // 开始事务
    await query("BEGIN");

    // 首先检查用户是否被拉黑
    const userResult = await query(`SELECT deleted FROM users WHERE id = $1`, [
      userId,
    ]);

    if (userResult.rows.length === 0) {
      throw new Error("User does not exist");
    }

    if (userResult.rows[0].deleted) {
      throw new Error("User is blocked");
    }

    // 获取模型价格
    const modelResult = await query(
      `SELECT input_price, output_price, per_msg_price FROM model_prices WHERE model_id = $1`,
      [modelId]
    );

    if (modelResult.rows.length === 0) {
      throw new Error("Model price not found");
    }

    const modelPrice = modelResult.rows[0];

    // 计算成本
    let totalCost: number;
    if (modelPrice.per_msg_price >= 0) {
      totalCost = Number(modelPrice.per_msg_price);
    } else {
      const inputCost = (inputTokens / 1_000_000) * modelPrice.input_price;
      const outputCost = (outputTokens / 1_000_000) * modelPrice.output_price;
      totalCost = inputCost + outputCost;
    }

    // 更新用户余额
    const balanceResult = await query(
      `UPDATE users 
       SET balance = balance - $1
       WHERE id = $2 AND NOT deleted
       RETURNING balance`,
      [totalCost, userId]
    );

    if (balanceResult.rows.length === 0) {
      throw new Error("Failed to update user balance or user is blocked");
    }

    const newBalance = Number(balanceResult.rows[0].balance);

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
      balance: newBalance,
      cost: totalCost,
    });
  } catch (error) {
    await query("ROLLBACK");
    console.error("Failed to process request:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const status = errorMessage === "User is blocked" ? 403 : 500;

    return NextResponse.json(
      {
        error: errorMessage,
        code:
          errorMessage === "User is blocked"
            ? "USER_BLOCKED"
            : "INTERNAL_ERROR",
      },
      { status }
    );
  }
}
