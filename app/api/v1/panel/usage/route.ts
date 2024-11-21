import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const [modelResult, userResult] = await Promise.all([
      pool.query(`
        SELECT 
          model_name,
          COUNT(*) as total_count,
          COALESCE(SUM(cost), 0) as total_cost
        FROM user_usage_records
        GROUP BY model_name
        ORDER BY total_cost DESC
      `),
      pool.query(`
        SELECT 
          nickname,
          COUNT(*) as total_count,
          COALESCE(SUM(cost), 0) as total_cost
        FROM user_usage_records
        GROUP BY nickname
        ORDER BY total_cost DESC
        LIMIT 10
      `),
    ]);

    const formattedData = {
      models: modelResult.rows.map((row) => ({
        model_name: row.model_name,
        total_count: parseInt(row.total_count),
        total_cost: parseFloat(row.total_cost),
      })),
      users: userResult.rows.map((row) => ({
        nickname: row.nickname,
        total_count: parseInt(row.total_count),
        total_cost: parseFloat(row.total_cost),
      })),
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("获取使用统计失败:", error);
    return NextResponse.json({ error: "获取使用统计失败" }, { status: 500 });
  }
}
