import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "缺少文件名" }, { status: 400 });
    }

    if (!request.body) {
      return NextResponse.json({ error: "缺少文件内容" }, { status: 400 });
    }

    const blob = await put(filename, request.body, {
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("文件上传失败:", error);
    return NextResponse.json({ error: "文件上传失败" }, { status: 500 });
  }
}
