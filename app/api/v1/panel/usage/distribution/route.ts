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
    const tzOffsetMinutes = Number(searchParams.get("tzOffsetMinutes") || "0");

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing startTime/endTime" },
        { status: 400 }
      );
    }

    const result = await query(
      `
      SELECT
        EXTRACT(HOUR FROM ((use_time AT TIME ZONE 'UTC') + ($3 * INTERVAL '1 minute')))::int AS hour,
        COUNT(*)::int AS calls,
        COALESCE(SUM(input_tokens + output_tokens), 0)::bigint AS tokens,
        COALESCE(SUM(cost), 0) AS cost
      FROM user_usage_records
      WHERE use_time >= $1 AND use_time <= $2
      GROUP BY hour
      ORDER BY hour ASC
    `,
      [startTime, endTime, tzOffsetMinutes]
    );

    const buckets = result.rows.map((row) => ({
      hour: Number(row.hour),
      calls: Number(row.calls),
      tokens: Number(row.tokens),
      cost: Number(row.cost),
    }));

    return NextResponse.json({ buckets });
  } catch (error) {
    console.error("Fail to fetch usage distribution:", error);
    return NextResponse.json(
      { error: "Fail to fetch usage distribution" },
      { status: 500 }
    );
  }
}

