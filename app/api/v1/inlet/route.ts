import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db/users";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const user = await getOrCreateUser(data.user);

    return NextResponse.json({
      success: true,
      balance: Number(user.balance),
      message: "Request successful",
    });
  } catch (error) {
    console.error("Inlet error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error dealing with request",
        error_type: error instanceof Error ? error.name : "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
