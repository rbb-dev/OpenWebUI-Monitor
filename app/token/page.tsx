"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Loader2, HelpCircle } from "lucide-react";

export default function TokenPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      toast.error("请输入访问令牌");
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem("access_token", token);

      const res = await fetch("/api/config", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("令牌验证成功");
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        toast.error("无效的访问令牌");
        localStorage.removeItem("access_token");
      }
    } catch (error) {
      console.error("验证失败:", error);
      toast.error("验证失败");
      localStorage.removeItem("access_token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dot-pattern dark:bg-dot-pattern-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/50 to-background/90 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6 z-10 px-4"
      >
        <Card className="border-border/50 shadow-lg backdrop-blur-md bg-background/95">
          <CardHeader className="space-y-2">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CardTitle className="text-3xl font-bold text-center bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
                OpenWebUI Monitor
              </CardTitle>
            </motion.div>
            <CardDescription className="text-center text-muted-foreground/80 text-sm">
              请输入访问令牌以继续访问系统
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="token" className="text-sm font-medium">
                    访问令牌
                  </Label>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/70 hover:text-muted-foreground cursor-pointer transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent
                        className="max-w-[260px] text-xs"
                        side="right"
                        sideOffset={10}
                      >
                        ACCESS_TOKEN 环境变量
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative group">
                  <Input
                    id="token"
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="请输入访问令牌"
                    className="w-full transition-shadow focus:shadow-md pr-4"
                    autoComplete="off"
                  />
                  <div className="absolute inset-0 rounded-md ring-1 ring-foreground/10 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showToken"
                  checked={showToken}
                  onCheckedChange={(checked) =>
                    setShowToken(checked as boolean)
                  }
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor="showToken"
                  className="text-sm font-medium leading-none cursor-pointer hover:text-foreground/80 transition-colors"
                >
                  显示令牌
                </Label>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmit}
              className="w-full font-medium relative overflow-hidden transition-all hover:shadow-md"
              disabled={loading}
              variant="default"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  验证中...
                </span>
              ) : (
                "确认"
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
