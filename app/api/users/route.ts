import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const sortField = searchParams.get("sortField");
    const sortOrder = searchParams.get("sortOrder");
    const search = searchParams.get("search");
    const deleted = searchParams.get("deleted") === "true";

    // 构建查询条件
    const conditions = [`deleted = ${deleted}`];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(LOWER(name) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex})`
      );
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // 获取总记录数
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取分页数据
    const result = await query(
      `SELECT id, email, name, role, balance, deleted, created_at 
       FROM users 
       ${whereClause} 
       ${
         sortField
           ? `ORDER BY ${sortField} ${sortOrder === "descend" ? "DESC" : "ASC"}`
           : "ORDER BY created_at DESC"
       }
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({
      users: result.rows,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
