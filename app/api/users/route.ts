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

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(LOWER(name) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex})`
      );
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 构建排序
    const orderClause = sortField
      ? `ORDER BY ${sortField} ${sortOrder === "descend" ? "DESC" : "ASC"}`
      : "ORDER BY created_at DESC";

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
       ${orderClause} 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
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
