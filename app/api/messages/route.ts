import { NextResponse } from "next/server";
import { db, messages } from "@/lib/db";

// GET 请求处理
export async function GET() {
  try {
    const allMessages = await db.select().from(messages);
    return NextResponse.json({ messages: allMessages });
  } catch (err) {
    console.error("获取消息失败:", err);
    return NextResponse.json({ error: "获取消息失败" }, { status: 500 });
  }
}

// POST 请求处理
export async function POST(request: Request) {
  try {
    const { content, fileUrl } = await request.json();
    const newMessage = await db
      .insert(messages)
      .values({
        content,
        fileUrl: fileUrl || null,
      })
      .returning();
    return NextResponse.json({ message: newMessage[0] });
  } catch (err) {
    console.error("创建消息失败:", err);
    return NextResponse.json({ error: "创建消息失败" }, { status: 500 });
  }
}
