import { NextRequest, NextResponse } from "next/server";
import { deleteUser } from "@/lib/db/users";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteUser(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fail to delete user:", error);
    return NextResponse.json({ error: "Fail to delete user" }, { status: 500 });
  }
}
