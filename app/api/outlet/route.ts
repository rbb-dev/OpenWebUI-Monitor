import { NextResponse } from "next/server";

interface OutletRequest {
  message: {
    // 消息相关字段
    content: string;
    timestamp: string;
    // ... 其他消息字段
  };
  userInfo: {
    // 用户相关字段
    userId: string;
    username: string;
    // ... 其他用户信息字段
  };
}

export async function POST(request: Request) {
  try {
    const data: OutletRequest = await request.json();

    // 记录接收到的数据
    console.log("收到 outlet 请求:", JSON.stringify(data));

    // 返回占位符响应
    return NextResponse.json({
      status: "success",
      message: "outlet 请求已处理",
      timestamp: new Date().toISOString(),
      placeholder: {
        messageProcessed: true,
        responseTime: "0.2s",
        sessionId: Math.random().toString(36).substring(7),
      },
    });
  } catch (error) {
    console.error("处理 outlet 请求失败:", error);
    return NextResponse.json({ error: "处理请求失败" }, { status: 500 });
  }
}
