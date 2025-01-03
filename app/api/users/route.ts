import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/db/users";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const sortField = searchParams.get("sortField");
    const sortOrder = searchParams.get("sortOrder");
    const search = searchParams.get("search");

    const result = await getUsers({
      page,
      sortField,
      sortOrder,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}
