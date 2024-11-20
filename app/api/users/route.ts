import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const countResult = await sql`SELECT COUNT(*) FROM users`;
    const total = parseInt(countResult.rows[0].count);

    const result = await sql`
      SELECT 
        id, 
        email,
        name,
        role, 
        balance
      FROM users
      ORDER BY id DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    return NextResponse.json({
      users: result.rows,
      total,
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}
