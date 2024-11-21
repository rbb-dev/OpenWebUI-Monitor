import { NextResponse } from "next/server";
import { encode } from "gpt-tokenizer/model/gpt-4";
import { sql } from "@vercel/postgres";
import { updateUserBalance } from "@/lib/db/users";
import { ensureTablesExist } from "@/lib/db";

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

async function getModelPrice(modelId: string): Promise<ModelPrice | null> {
  const result = await sql<ModelPrice>`
    SELECT id, name, input_price, output_price 
    FROM model_prices 
    WHERE id = ${modelId}
  `;
  return result.rows[0] || null;
}

export async function POST(req: Request) {
  try {
    // 确保所有必要的表都已创建
    await ensureTablesExist();

    const data = await req.json();
    const modelId = data.body.model;
    const userId = data.user.id;
    const userName = data.user.name || "Unknown User";

    // console.log(`outlet data: ${JSON.stringify(data.body)}`);

    // 获取最后一条消息（输出）的 tokens
    const lastMessage = data.body.messages[data.body.messages.length - 1];
    const outputTokens = encode(lastMessage.content).length;

    // 计算输入 tokens（总 tokens - 输出 tokens）
    const totalTokens = data.body.messages.reduce(
      (sum: number, msg: Message) => {
        return sum + encode(msg.content).length;
      },
      0
    );
    const inputTokens = totalTokens - outputTokens;

    // 获取模型价格
    const modelPrice = await getModelPrice(modelId);
    if (!modelPrice) {
      throw new Error(`未找到模型 ${modelId} 的价格信息`);
    }

    // 计算成本（价格单位是每 1M tokens）
    const inputCost = (inputTokens / 1_000_000) * modelPrice.input_price;
    const outputCost = (outputTokens / 1_000_000) * modelPrice.output_price;
    const totalCost = inputCost + outputCost;

    // 首先获取用户信息和当前余额
    const userResult = await sql`
      SELECT balance FROM users WHERE id = ${userId}
    `;

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const user = userResult.rows[0];
    const newBalance = Number(user.balance) - Number(totalCost);

    // 开启事务
    await sql`BEGIN`;

    try {
      // 更新用户余额
      await sql`
        UPDATE users 
        SET balance = ${newBalance}
        WHERE id = ${userId}
      `;

      // 记录使用情况
      console.log("正在记录使用情况:", {
        userId,
        userName,
        modelId,
        inputTokens,
        outputTokens,
        totalCost,
        newBalance,
      });

      await sql`
        INSERT INTO user_usage_records (
          user_id,
          nickname,
          model_name,
          input_tokens,
          output_tokens,
          cost,
          balance_after
        ) VALUES (
          ${userId},
          ${userName},
          ${modelId},
          ${inputTokens},
          ${outputTokens},
          ${totalCost},
          ${newBalance}
        )
      `;

      await sql`COMMIT`;

      return NextResponse.json({
        success: true,
        newBalance,
        message: `输入 \`${inputTokens} tokens\`, 输出 \`${outputTokens} tokens\`, 消耗 \`¥${totalCost}\`, 余额 \`¥${newBalance}\``,
      });
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error("Outlet error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "处理请求时发生错误",
      },
      { status: 500 }
    );
  }
}
