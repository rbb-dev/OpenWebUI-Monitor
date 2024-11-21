import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const offset = (page - 1) * pageSize;

    const countResult = await sql`
      SELECT COUNT(*) FROM user_usage_records
    `;
    const total = parseInt(countResult.rows[0].count);

    const records = await sql`
      SELECT *
      FROM user_usage_records
      ORDER BY use_time DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    return NextResponse.json({
      records: records.rows,
      total,
    });
  } catch (error) {
    console.error("获取使用记录失败:", error);
    return NextResponse.json({ error: "获取使用记录失败" }, { status: 500 });
  }
}
