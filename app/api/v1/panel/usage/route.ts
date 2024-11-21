import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql`
      SELECT 
        model_name,
        COUNT(*) as total_count,
        COALESCE(SUM(cost), 0) as total_cost
      FROM user_usage_records
      GROUP BY model_name
      ORDER BY total_cost DESC
    `;

    // console.log("查询结果:", result.rows);

    if (result.rows.length === 0) {
      console.log("没有找到使用记录");
      return NextResponse.json([]);
    }

    const formattedData = result.rows.map((row) => ({
      model_name: row.model_name,
      total_count: parseInt(row.total_count),
      total_cost: parseFloat(row.total_cost),
    }));

    // console.log("格式化后的数据:", formattedData);

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("获取使用统计失败:", error);
    return NextResponse.json({ error: "获取使用统计失败" }, { status: 500 });
  }
}
