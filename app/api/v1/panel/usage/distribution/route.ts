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
    const bucket = (searchParams.get("bucket") || "hour").toLowerCase();

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing startTime/endTime" },
        { status: 400 }
      );
    }

    const bucketExpr =
      bucket === "isodow"
        ? "EXTRACT(ISODOW FROM ((use_time AT TIME ZONE 'UTC') + ($3 * INTERVAL '1 minute')))::int"
        : "EXTRACT(HOUR FROM ((use_time AT TIME ZONE 'UTC') + ($3 * INTERVAL '1 minute')))::int";

    const result = await query(
      `
      SELECT
        ${bucketExpr} AS bucket,
        COUNT(*)::int AS calls,
        COALESCE(SUM(input_tokens + output_tokens), 0)::bigint AS tokens,
        COALESCE(SUM(cost), 0) AS cost
      FROM user_usage_records
      WHERE use_time >= $1 AND use_time <= $2
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
      [startTime, endTime, tzOffsetMinutes]
    );

    const buckets = result.rows.map((row) => ({
      bucket: Number(row.bucket),
      calls: Number(row.calls),
      tokens: Number(row.tokens),
      cost: Number(row.cost),
    }));

    return NextResponse.json({
      bucketType: bucket === "isodow" ? "isodow" : "hour",
      buckets,
    });
  } catch (error) {
    console.error("Fail to fetch usage distribution:", error);
    return NextResponse.json(
      { error: "Fail to fetch usage distribution" },
      { status: 500 }
    );
  }
}
