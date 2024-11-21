import { NextResponse } from "next/server";
import { updateModelPrice } from "@/lib/db";

interface PriceUpdate {
  id: string;
  input_price: number;
  output_price: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 处理单个更新的情况
    if (body.id) {
      const result = await updateModelPrice(
        body.id,
        body.input_price,
        body.output_price
      );

      if (!result) {
        return NextResponse.json({ error: "模型不存在" }, { status: 404 });
      }

      return NextResponse.json({
        input_price: result.input_price,
        output_price: result.output_price,
      });
    }

    // 处理批量更新的情况
    if (body.updates && Array.isArray(body.updates)) {
      // 验证每个更新项
      const validUpdates = body.updates.filter(
        (update: PriceUpdate) =>
          update.id &&
          typeof update.input_price === "number" &&
          typeof update.output_price === "number" &&
          update.input_price >= 0 &&
          update.output_price >= 0
      );

      // 执行批量更新
      const results = await Promise.all(
        validUpdates.map(
          (update: { id: string; input_price: number; output_price: number }) =>
            updateModelPrice(update.id, update.input_price, update.output_price)
        )
      );

      return NextResponse.json({
        success: true,
        updatedCount: results.filter(Boolean).length,
      });
    }

    return NextResponse.json({ error: "无效的请求格式" }, { status: 400 });
  } catch (error) {
    console.error("更新价格失败:", error);
    return NextResponse.json({ error: "更新价格失败" }, { status: 500 });
  }
}
