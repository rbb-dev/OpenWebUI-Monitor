import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const records = await sql`
      SELECT 
        nickname,
        use_time,
        model_name,
        input_tokens,
        output_tokens,
        cost,
        balance_after
      FROM user_usage_records
      ORDER BY use_time DESC
    `;

    // 生成 CSV 内容
    const csvHeaders = [
      "用户",
      "使用时间",
      "模型",
      "输入tokens",
      "输出tokens",
      "消耗金额",
      "剩余余额",
    ];
    const rows = records.rows.map((record) => [
      record.nickname,
      new Date(record.use_time).toLocaleString(),
      record.model_name,
      record.input_tokens,
      record.output_tokens,
      Number(record.cost).toFixed(4),
      Number(record.balance_after).toFixed(4),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // 设置响应头
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/csv; charset=utf-8");
    responseHeaders.set(
      "Content-Disposition",
      "attachment; filename=usage_records.csv"
    );

    return new Response(csvContent, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("导出记录失败:", error);
    return NextResponse.json({ error: "导出记录失败" }, { status: 500 });
  }
}
