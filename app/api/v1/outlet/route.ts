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
    console.log(data);
    const modelId = data.body.model;
    const userId = data.user.id;
    const userName = data.user.name || "Unknown User";

    // 开启事务
    await query("BEGIN");

    // 获取模型价格
    const modelPrice = await getModelPrice(modelId);
    if (!modelPrice) {
      throw new Error(`Fail to fetch price info of model ${modelId}`);
    }

    // 计算 tokens
    const lastMessage = data.body.messages[data.body.messages.length - 1];

    let inputTokens: number;
    let outputTokens: number;
    if (
      lastMessage.info &&
      lastMessage.info.prompt_tokens &&
      lastMessage.info.completion_tokens
    ) {
      inputTokens = lastMessage.info.prompt_tokens;
      outputTokens = lastMessage.info.completion_tokens;
    } else {
      outputTokens = encode(lastMessage.content).length;
      const totalTokens = data.body.messages.reduce(
        (sum: number, msg: Message) => sum + encode(msg.content).length,
        0
      );
      inputTokens = totalTokens - outputTokens;
    }

    // 计算成本
    let totalCost: number;
    if (outputTokens === 0) {
      // 如果输出token为0，则不收费
      totalCost = 0;
      console.log("No charge for zero output tokens");
    } else if (modelPrice.per_msg_price >= 0) {
      // 如果设置了每条消息的固定价格，直接使用
      totalCost = Number(modelPrice.per_msg_price);
      console.log(
        `Using fixed pricing: ${totalCost} (${modelPrice.per_msg_price} per message)`
      );
    } else {
      // 否则按 token 数量计算价格
      const inputCost = (inputTokens / 1_000_000) * modelPrice.input_price;
      const outputCost = (outputTokens / 1_000_000) * modelPrice.output_price;
      totalCost = inputCost + outputCost;
    }

    // 获取 inlet 时预扣的费用
    const inletCost = data.inlet_cost || 0;

    // 实际需要扣除的费用 = 总费用 - 预扣费用
    const actualCost = totalCost - inletCost;

    // 获取并更新用户余额
    const userResult = await query(
      `UPDATE users 
       SET balance = LEAST(
         balance - CAST($1 AS DECIMAL(16,4)),
         999999.9999
       )
       WHERE id = $2
       RETURNING balance`,
      [actualCost, userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error("User does not exist");
    }

    const newBalance = Number(userResult.rows[0].balance);

    if (newBalance > 999999.9999) {
      throw new Error("Balance exceeds maximum allowed value");
    }

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
        actualCost,
        newBalance,
      ]
    );

    await query("COMMIT");

    console.log(
      JSON.stringify({
        success: true,
        inputTokens,
        outputTokens,
        totalCost,
        newBalance,
        message: "Request successful",
      })
    );

    return NextResponse.json({
      success: true,
      inputTokens,
      outputTokens,
      totalCost,
      newBalance,
      message: "Request successful",
    });
  } catch (error) {
    await query("ROLLBACK");
    console.error("Outlet error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error processing request",
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
