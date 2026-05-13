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
      startTime && endTime
        ? `AND uur.use_time >= $1 AND uur.use_time <= $2`
        : "";

    const params = startTime && endTime ? [startTime, endTime] : [];

    const result = await query(
      `
        SELECT
          LOWER(SPLIT_PART(u.email, '@', 2))                              AS domain,
          COUNT(*)                                                         AS total_calls,
          COALESCE(SUM(uur.input_tokens + uur.output_tokens), 0)::bigint  AS total_tokens,
          COALESCE(SUM(uur.cost), 0)                                       AS total_cost,
          COUNT(DISTINCT uur.user_id)                                      AS user_count
        FROM user_usage_records uur
        JOIN users u ON u.id = uur.user_id
        WHERE (u.deleted = FALSE OR u.deleted IS NULL)
          AND POSITION('@' IN u.email) > 0
          ${timeFilter}
        GROUP BY domain
        ORDER BY total_cost DESC
      `,
      params
    );

    const domains = result.rows.map((row) => ({
      domain: row.domain,
      total_cost: parseFloat(row.total_cost),
      total_calls: parseInt(row.total_calls),
      total_tokens: parseInt(row.total_tokens),
      user_count: parseInt(row.user_count),
    }));

    return NextResponse.json({ domains });
  } catch (error) {
    console.error("Fail to fetch domain usage:", error);
    if (error instanceof Error) {
      console.error("[DB Query Error]", error);
    }
    return NextResponse.json(
      { error: "Fail to fetch domain usage" },
      { status: 500 }
    );
  }
}
