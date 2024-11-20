import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db/users";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log(`inlet data: ${JSON.stringify(data)}`);
    // 直接处理用户数据，不再每次检查表是否存在
    const user = await getOrCreateUser(data.user);

    return NextResponse.json({
      message: "用户数据处理成功",
      user: {
        ...user,
        balance: Number(user.balance),
      },
      operation: "success",
    });
  } catch (error) {
    console.error("Inlet error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "处理请求时发生错误",
      },
      { status: 500 }
    );
  }
}
