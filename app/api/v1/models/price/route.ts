import { NextRequest, NextResponse } from "next/server";
import { updateModelPrice } from "@/lib/db";

interface PriceUpdate {
  id: string;
  input_price: number;
  output_price: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 处理单个更新的情况
    if (body.id) {
      console.log("单个价格更新请求:", {
        id: body.id,
        input_price: body.input_price,
        output_price: body.output_price,
      });

      const result = await updateModelPrice(
        body.id,
        body.input_price,
        body.output_price
      );

      if (!result) {
        console.log("模型不存在:", body.id);
        return NextResponse.json({ error: "模型不存在" }, { status: 404 });
      }

      return NextResponse.json({
        input_price: result.input_price,
        output_price: result.output_price,
      });
    }

    // 处理批量更新的情况
    if (body.updates && Array.isArray(body.updates)) {
      console.log("收到批量更新请求，原始数据:", body.updates);

      // 验证并转换每个更新项
      const validUpdates = body.updates
        .map((update: any) => ({
          id: update.id,
          input_price: Number(update.input_price),
          output_price: Number(update.output_price),
        }))
        .filter(
          (update: PriceUpdate) =>
            update.id &&
            !isNaN(update.input_price) &&
            !isNaN(update.output_price) &&
            update.input_price >= 0 &&
            update.output_price >= 0
        );

      console.log("验证后的有效更新数据:", validUpdates);

      // 执行批量更新并收集结果
      const results = await Promise.all(
        validUpdates.map(async (update: PriceUpdate) => {
          try {
            console.log("正在更新模型:", update.id, {
              input_price: update.input_price,
              output_price: update.output_price,
            });

            const result = await updateModelPrice(
              update.id,
              update.input_price,
              update.output_price
            );

            if (!result) {
              console.log("更新失败 - 模型不存在:", update.id);
            } else {
              console.log("更新成功:", {
                id: update.id,
                newPrices: {
                  input_price: result.input_price,
                  output_price: result.output_price,
                },
              });
            }

            return {
              id: update.id,
              success: !!result,
              data: result,
            };
          } catch (error) {
            console.error("更新模型时出错:", update.id, error);
            return {
              id: update.id,
              success: false,
              error: error instanceof Error ? error.message : "未知错误",
            };
          }
        })
      );

      // 过滤出成功更新的记录
      const successfulUpdates = results.filter((r) => r.success);
      console.log("成功更新的数量:", successfulUpdates.length);
      console.log("更新结果汇总:", {
        total: results.length,
        successful: successfulUpdates.length,
        failed: results.length - successfulUpdates.length,
      });

      return NextResponse.json({
        success: true,
        updatedCount: successfulUpdates.length,
        results: successfulUpdates.map((r) => ({
          id: r.id,
          input_price: r.data?.input_price,
          output_price: r.data?.output_price,
        })),
      });
    }

    console.log("无效的请求格式:", body);
    return NextResponse.json({ error: "无效的请求格式" }, { status: 400 });
  } catch (error) {
    console.error("处理请求时发生错误:", error);
    return NextResponse.json({ error: "更新价格失败" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
