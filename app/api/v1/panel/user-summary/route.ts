import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";
import { verifyApiToken } from "@/lib/auth";

export async function GET(request: Request) {
  const authError = verifyApiToken(request);
  if (authError) {
    return authError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    const timeFilter =
      startTime && endTime ? `WHERE use_time >= $1 AND use_time <= $2` : "";

    const params = startTime && endTime ? [startTime, endTime] : [];

    const result = await query(
      `
        SELECT
          nickname,
          COUNT(*)                                                       AS total_calls,
          COALESCE(SUM(input_tokens + output_tokens), 0)::bigint        AS total_tokens,
          COALESCE(SUM(cost), 0)                                         AS total_cost
        FROM user_usage_records
        ${timeFilter}
        GROUP BY nickname
        ORDER BY total_cost DESC
      `,
      params
    );

    const users = result.rows.map((row) => ({
      nickname: row.nickname,
      total_calls: parseInt(row.total_calls),
      total_tokens: parseInt(row.total_tokens),
      total_cost: parseFloat(row.total_cost),
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Fail to fetch user summary:", error);
    if (error instanceof Error) {
      console.error("[DB Query Error]", error);
    }
    return NextResponse.json(
      { error: "Fail to fetch user summary" },
      { status: 500 }
    );
  }
}
