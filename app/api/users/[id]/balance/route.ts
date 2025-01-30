import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(
      `SELECT balance, deleted FROM users WHERE id = $1`,
      [params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 如果用户已被拉黑，返回 -1
    const balance = result.rows[0].deleted
      ? -1
      : Number(result.rows[0].balance);

    return NextResponse.json({ balance });
  } catch (error) {
    console.error("Failed to get user balance:", error);
    return NextResponse.json(
      { error: "Failed to get user balance" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { balance } = await req.json();

    // 先检查用户是否被拉黑
    const checkResult = await query(`SELECT deleted FROM users WHERE id = $1`, [
      params.id,
    ]);

    if (checkResult.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (checkResult.rows[0].deleted) {
      return NextResponse.json(
        { error: "Cannot update balance of blocked user" },
        { status: 403 }
      );
    }

    // 更新余额
    const result = await query(
      `UPDATE users SET balance = $1 WHERE id = $2 RETURNING balance`,
      [balance, params.id]
    );

    return NextResponse.json({
      balance: Number(result.rows[0].balance),
    });
  } catch (error) {
    console.error("Failed to update user balance:", error);
    return NextResponse.json(
      { error: "Failed to update user balance" },
      { status: 500 }
    );
  }
}
