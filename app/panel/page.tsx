"use client";

import { useState, useEffect } from "react";
import { Card, Radio, Button, Spin } from "antd";
import { useRouter, usePathname } from "next/navigation";
import { Pie, Column } from "@ant-design/plots";

interface ModelUsage {
  model_name: string;
  total_cost: number;
  total_count: number;
}

interface UserUsage {
  nickname: string;
  total_cost: number;
  total_count: number;
}

interface UsageData {
  models: ModelUsage[];
  users: UserUsage[];
}

export default function PanelPage() {
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData>({
    models: [],
    users: [],
  });
  const [metric, setMetric] = useState<"cost" | "count">("cost");
  const router = useRouter();
  const pathname = usePathname();

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/panel/usage?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setUsageData(data);
    } catch (error) {
      console.error("获取使用数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, [pathname]);

  const pieData = usageData.models
    .map((item) => ({
      type: item.model_name,
      value: metric === "cost" ? Number(item.total_cost) : item.total_count,
    }))
    .filter((item) => item.value > 0);

  const columnData = usageData.users
    .map((item) => ({
      nickname: item.nickname,
      value: metric === "cost" ? Number(item.total_cost) : item.total_count,
    }))
    .sort((a, b) => b.value - a.value);

  const config = {
    data: pieData,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    label: {
      text: (d: any) => {
        return `${d.type}\n${
          metric === "cost" ? `¥${d.value.toFixed(4)}` : d.value
        }`;
      },
      position: "outside",
      style: {
        fontSize: 12,
        textAlign: "center",
      },
      line: {
        style: {
          stroke: "#595959",
        },
      },
    },
    style: {
      stroke: "#fff",
      lineWidth: 1,
    },
    legend: {
      color: {
        title: false,
        position: "right",
        rowPadding: 5,
      },
    },
    state: {
      active: {
        style: {
          lineWidth: 2,
          stroke: "#000",
          offset: 2,
          scale: 1.1,
        },
      },
    },
    interactions: [
      {
        type: "element-active",
      },
    ],
    animation: {
      appear: {
        duration: 1000,
      },
    },
    statistic: {
      title: {
        content: metric === "cost" ? "总消耗" : "总次数",
        style: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "#4B5563",
        },
      },
      content: {
        style: {
          fontSize: "24px",
          lineHeight: "32px",
          color: "#1F2937",
        },
        formatter: () => {
          const total = pieData.reduce((sum, item) => sum + item.value, 0);
          return metric === "cost" ? `¥${total.toFixed(4)}` : total.toString();
        },
      },
    },
  };

  const columnConfig = {
    data: columnData,
    xField: "nickname",
    yField: "value",
    label: {
      position: "top",
      formatter: (v: any) =>
        metric === "cost" ? `¥${v.toFixed(4)}` : v.toString(),
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
        autoEllipsis: true,
      },
    },
    meta: {
      nickname: {
        alias: "用户",
      },
      value: {
        alias: metric === "cost" ? "消耗金额" : "使用次数",
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">使用统计看板</h1>
        <Radio.Group
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          buttonStyle="solid"
          className="shadow-sm"
        >
          <Radio.Button value="cost">按金额</Radio.Button>
          <Radio.Button value="count">按次数</Radio.Button>
        </Radio.Group>
      </div>

      <Card className="mb-8 shadow-md hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-xl font-bold mb-4 text-gray-700">模型使用分布</h2>
        {loading ? (
          <div className="flex justify-center items-center h-[400px] bg-gray-50 rounded-lg">
            <Spin size="large" />
          </div>
        ) : (
          <div className="h-[400px]">
            <Pie {...config} />
          </div>
        )}
      </Card>

      <Card className="mb-8 shadow-md hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-xl font-bold mb-4 text-gray-700">
          用户使用排行（Top 10）
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-[400px] bg-gray-50 rounded-lg">
            <Spin size="large" />
          </div>
        ) : (
          <div className="h-[400px]">
            <Column {...columnConfig} />
          </div>
        )}
      </Card>

      <div className="flex justify-center">
        <Button
          type="primary"
          size="large"
          onClick={() => router.push("/records")}
          className="px-8 h-12 text-base shadow-md hover:shadow-lg transition-all duration-300"
        >
          查看详细记录
        </Button>
      </div>
    </div>
  );
}
