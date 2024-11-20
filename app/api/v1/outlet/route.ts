import { NextResponse } from "next/server";
import { encode } from "gpt-tokenizer/model/gpt-4"; // 使用 GPT-4 的 tokenizer

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Outlet received:", JSON.stringify(data, null, 2));

    // 获取最后一条消息
    const lastMessage = data.body.messages[data.body.messages.length - 1];

    // 计算最后一条消息的 tokens
    const lastMessageTokens = encode(lastMessage.content);

    // 计算所有消息的总 tokens
    const totalTokens = data.body.messages.reduce((sum: number, msg: any) => {
      return sum + encode(msg.content).length;
    }, 0);

    return NextResponse.json({
      message: `最后一条消息 "${lastMessage.content}" 包含 ${lastMessageTokens.length} 个 tokens。所有消息总共包含 ${totalTokens} 个 tokens。`,
      last_message_tokens: lastMessageTokens.length,
      total_tokens: totalTokens,
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
