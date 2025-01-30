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
    console.error("Fail to fetch user list:", error);
    return NextResponse.json(
      { error: "Fail to fetch user list" },
      { status: 500 }
    );
  }
}
