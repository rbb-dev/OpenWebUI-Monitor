"use client";

import { useState, useEffect } from "react";
import { Dropdown, Avatar } from "antd";
import type { MenuProps } from "antd";
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtVerify } from "jose";
import React from "react";

const JWT_SECRET = "your-secret-key";

interface UserInfo {
  username: string;
  isAdmin: boolean;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    if (token) {
      jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
        .then(({ payload }) => {
          setUser({
            username: payload.username as string,
            isAdmin: payload.isAdmin as boolean,
          });
        })
        .catch((error) => {
          document.cookie =
            "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          router.push("/auth");
        });
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/auth");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const items: MenuProps["items"] = [
    {
      key: "logout",
      label: "退出登录",
      icon: <LogOut className="w-4 h-4 text-gray-500" />,
      onClick: handleLogout,
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-50">
      <Dropdown menu={{ items }} placement="bottomRight">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50/80 px-3 py-1.5 rounded-full transition-colors">
          <Avatar
            size="small"
            icon={<User className="w-3 h-3 text-gray-600" />}
          />
          <span className="text-sm text-gray-600">{user.username}</span>
        </div>
      </Dropdown>
    </div>
  );
}
