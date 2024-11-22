import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const users = searchParams.get("users")?.split(",");
    const models = searchParams.get("models")?.split(",");
    const sortField = searchParams.get("sortField");
    const sortOrder = searchParams.get("sortOrder");
    const offset = (page - 1) * pageSize;

    let conditions = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (users && users.length > 0) {
      conditions.push(`nickname = ANY($${paramIndex})`);
      params.push(users);
      paramIndex += 1;
    }

    if (models && models.length > 0) {
      conditions.push(`model_name = ANY($${paramIndex})`);
      params.push(models);
      paramIndex += 1;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [countResult, records] = await Promise.all([
      sql.query(
        `
        SELECT COUNT(*) 
        FROM user_usage_records
        ${whereClause}
      `,
        params
      ),
      sql.query(
        `
        SELECT *
        FROM user_usage_records
        ${whereClause}
        ${
          sortField
            ? `ORDER BY ${sortField} ${sortOrder === "ascend" ? "ASC" : "DESC"}`
            : "ORDER BY use_time DESC"
        }
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
        [...params, pageSize, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      records: records.rows,
      total,
    });
  } catch (error) {
    console.error("获取使用记录失败:", error);
    return NextResponse.json({ error: "获取使用记录失败" }, { status: 500 });
  }
}
