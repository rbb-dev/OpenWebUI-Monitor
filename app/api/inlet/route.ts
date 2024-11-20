import { NextResponse } from "next/server";

interface InletRequest {
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
    const data: InletRequest = await request.json();

    // 记录接收到的数据
    console.log("收到 inlet 请求:", JSON.stringify(data));

    // 返回占位符响应
    return NextResponse.json({
      status: "success",
      message: "inlet 请求已处理",
      timestamp: new Date().toISOString(),
      placeholder: {
        messageReceived: true,
        processingTime: "0.1s",
        requestId: Math.random().toString(36).substring(7),
      },
    });
  } catch (error) {
    console.error("处理 inlet 请求失败:", error);
    return NextResponse.json({ error: "处理请求失败" }, { status: 500 });
  }
}
