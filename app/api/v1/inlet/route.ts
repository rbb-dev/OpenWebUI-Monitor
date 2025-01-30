import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db/users";
import { query } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // 获取用户信息，包括 deleted 状态
    const userResult = await query(
      `SELECT id, email, name, role, balance, deleted 
       FROM users 
       WHERE id = $1`,
      [data.id]
    );

    let user;
    if (userResult.rows.length === 0) {
      user = await getOrCreateUser(data);
    } else {
      user = userResult.rows[0];
    }

    // 如果用户被拉黑，返回余额为 -1
    const balance = user.deleted ? -1 : Number(user.balance);

    return NextResponse.json({
      ...user,
      balance,
    });
  } catch (error) {
    console.error("Failed to process inlet request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
