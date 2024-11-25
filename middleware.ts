import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_KEY = process.env.API_KEY;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

export async function middleware(request: NextRequest) {
  // console.log("中间件处理路径:", request.nextUrl.pathname);
  const { pathname } = request.nextUrl;

  // 只验证 inlet/outlet/test API 请求
  if (
    pathname.startsWith("/api/v1/inlet") ||
    pathname.startsWith("/api/v1/outlet") ||
    pathname.startsWith("/api/v1/models/test")
  ) {
    // API 请求验证
    if (!API_KEY) {
      console.error("未设置 API_KEY 环境变量");
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    const providedKey = authHeader?.replace("Bearer ", "");

    if (!providedKey || providedKey !== API_KEY) {
      console.log("API密钥无效");
      return NextResponse.json({ error: "无效的API密钥" }, { status: 401 });
    }

    // API 密钥验证通过后直接返回
    return NextResponse.next();
  } else if (!pathname.startsWith("/api/")) {
    // 页面访问验证
    if (!ACCESS_TOKEN) {
      console.error("未设置 ACCESS_TOKEN 环境变量");
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }

    const token = request.cookies.get("access_token")?.value;

    // 如果是令牌验证页面，直接允许访问
    if (pathname === "/token") {
      return NextResponse.next();
    }

    if (!token || token !== ACCESS_TOKEN) {
      console.log("访问令牌无效,重定向到令牌验证页");
      return NextResponse.redirect(new URL("/token", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
