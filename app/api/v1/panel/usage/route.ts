import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic"; // 禁用路由缓存
export const revalidate = 0; // 禁用数据缓存

export async function GET() {
  try {
    const [modelResult, userResult] = await Promise.all([
      sql`
        SELECT 
          model_name,
          COUNT(*) as total_count,
          COALESCE(SUM(cost), 0) as total_cost
        FROM user_usage_records
        GROUP BY model_name
        ORDER BY total_cost DESC
      `,
      sql`
        SELECT 
          nickname,
          COUNT(*) as total_count,
          COALESCE(SUM(cost), 0) as total_cost
        FROM user_usage_records
        GROUP BY nickname
        ORDER BY total_cost DESC
        LIMIT 10
      `,
    ]);

    // 设置响应头以禁用缓存
    const responseHeaders = new Headers();
    responseHeaders.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    responseHeaders.set("Pragma", "no-cache");
    responseHeaders.set("Expires", "0");
    responseHeaders.set("Surrogate-Control", "no-store");

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

    return new NextResponse(JSON.stringify(formattedData), {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("获取使用统计失败:", error);
    return NextResponse.json({ error: "获取使用统计失败" }, { status: 500 });
  }
}
