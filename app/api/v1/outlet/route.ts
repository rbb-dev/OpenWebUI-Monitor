import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  console.log("Outlet received:", JSON.stringify(data, null, 2));

  return NextResponse.json({ message: "Outlet placeholder response" });
}
