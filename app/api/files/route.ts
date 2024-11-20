import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { blobs } = await list();
    return NextResponse.json({ files: blobs });
  } catch (error) {
    console.error("获取文件列表失败:", error);
    return NextResponse.json({ error: "获取文件列表失败" }, { status: 500 });
  }
}
