import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("access_token");

  if (!accessToken || accessToken.value !== process.env.ACCESS_TOKEN) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  return NextResponse.json({ apiKey: process.env.API_KEY });
}
