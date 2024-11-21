"use client";

import { useState, useEffect } from "react";
import { Card, Radio, Button, Spin } from "antd";
import { useRouter } from "next/navigation";
import { Pie } from "@ant-design/plots";

interface ModelUsage {
  model_name: string;
  total_cost: number;
  total_count: number;
}

export default function PanelPage() {
  const [loading, setLoading] = useState(true);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [metric, setMetric] = useState<"cost" | "count">("cost");
  const router = useRouter();

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await fetch("/api/v1/panel/usage");
      const data = await response.json();
      setModelUsage(data);
    } catch (error) {
      console.error("获取使用数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = modelUsage
    .map((item) => ({
      type: item.model_name,
      value: metric === "cost" ? Number(item.total_cost) : item.total_count,
    }))
    .filter((item) => item.value > 0);

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

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">使用统计看板</h1>
        <Radio.Group
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="cost">按金额</Radio.Button>
          <Radio.Button value="count">按次数</Radio.Button>
        </Radio.Group>
      </div>

      <Card className="mb-6">
        {loading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Spin size="large" />
          </div>
        ) : (
          <div className="h-[400px]">
            <Pie {...config} />
          </div>
        )}
      </Card>

      <div className="flex justify-center">
        <Button
          type="primary"
          size="large"
          onClick={() => router.push("/records")}
        >
          查看详细记录
        </Button>
      </div>
    </div>
  );
}
