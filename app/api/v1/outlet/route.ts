import { NextResponse } from "next/server";
import { encode } from "gpt-tokenizer/model/gpt-4";
import { sql } from "@vercel/postgres";
import { updateUserBalance } from "@/lib/db/users";

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
    const data = await req.json();
    const modelId = data.body.model;
    const userId = data.user.id;

    console.log(`outlet data: ${JSON.stringify(data.body)}`);

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

    // console.log("成本计算:", {
    //   inputTokens,
    //   outputTokens,
    //   inputCost,
    //   outputCost,
    //   totalCost,
    // });

    // 使用正确的高精度余额更新函数
    const newBalance = await updateUserBalance(userId, totalCost);

    // console.log("余额更新结果:", {
    //   oldBalance: null,
    //   newBalance,
    //   cost: totalCost,
    // });

    return NextResponse.json({
      message: `输入 \`${inputTokens} tokens\`，输出 \`${outputTokens} tokens\`，总计花费 \`￥${totalCost.toFixed(
        6
      )}\`，当前余额 \`￥${newBalance.toFixed(6)}\`。`,
    });
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
