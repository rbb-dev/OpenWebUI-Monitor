import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { modelId } = await req.json();

    if (!modelId) {
      throw new Error("模型ID不能为空");
    }

    const domain = process.env.OPENWEBUI_DOMAIN;
    const apiKey = process.env.OPENWEBUI_API_KEY;

    if (!domain || !apiKey) {
      throw new Error("环境变量未正确配置");
    }

    const apiUrl = domain.replace(/\/+$/, "") + "/api/models";
    // console.log("测试请求URL:", apiUrl);
    // console.log("测试模型ID:", modelId);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "user",
            content: "test, just say hi",
          },
        ],
      }),
    });

    const responseText = await response.text();
    // console.log("API响应:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("解析响应JSON失败:", e);
      throw new Error(`解析响应失败: ${responseText}`);
    }

    if (!response.ok) {
      console.error("API请求失败:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error(
        data.error || `API请求失败: ${response.status} ${response.statusText}`
      );
    }

    if (!data.choices?.[0]?.message?.content) {
      console.error("响应格式不正确:", data);
      throw new Error("响应格式不正确");
    }

    return NextResponse.json({
      success: true,
      message: "测试成功",
      response: data.choices[0].message.content,
    });
  } catch (error) {
    console.error("模型测试失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
