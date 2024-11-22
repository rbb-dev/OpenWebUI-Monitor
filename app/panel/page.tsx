"use client";

import { useState, useEffect, useRef } from "react";
import { Radio, Button, Spin } from "antd";
import { useRouter, usePathname } from "next/navigation";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";
import * as echarts from "echarts";

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
  const chartRef = useRef<ECharts>();
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

  const getPieOption = () => {
    const total = pieData.reduce((sum, item) => sum + item.value, 0);

    // 按值排序并处理小比例数据
    const sortedData = [...pieData]
      .sort((a, b) => b.value - a.value)
      .reduce((acc, curr) => {
        const percentage = (curr.value / total) * 100;
        if (percentage < 5) {
          const otherIndex = acc.findIndex((item) => item.name === "其他");
          if (otherIndex >= 0) {
            acc[otherIndex].value += curr.value;
          } else {
            acc.push({
              name: "其他",
              value: curr.value,
            });
          }
        } else {
          acc.push({
            name: curr.type,
            value: curr.value,
          });
        }
        return acc;
      }, [] as { name: string; value: number }[]);

    return {
      tooltip: {
        show: false,
      },
      series: [
        {
          name: metric === "cost" ? "消耗金额" : "使用次数",
          type: "pie",
          radius: ["30%", "85%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "#fff",
          },
          label: {
            show: true,
            position: "outside",
            alignTo: "none",
            margin: 8,
            formatter: (params: any) => {
              const percentage = ((params.value / total) * 100).toFixed(1);
              return [
                `{name|${params.name}}`,
                `{value|${
                  metric === "cost"
                    ? `¥${params.value.toFixed(4)}`
                    : `${params.value}次`
                }}`,
                `{per|${percentage}%}`,
              ].join("\n");
            },
            rich: {
              name: {
                fontSize: 12,
                color: "#666",
                padding: [0, 0, 2, 0],
                fontWeight: 500,
              },
              value: {
                fontSize: 11,
                color: "#333",
                padding: [2, 0],
              },
              per: {
                fontSize: 11,
                color: "#999",
              },
            },
            lineHeight: 14,
          },
          labelLayout: {
            hideOverlap: true,
          },
          labelLine: {
            show: true,
            length: 30,
            length2: 20,
            smooth: true,
          },
          data: sortedData,
          zlevel: 0,
          padAngle: 0.02,
        },
      ],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "middle",
          style: {
            text:
              metric === "cost"
                ? `总计\n¥${total.toFixed(2)}`
                : `总计\n${total}次`,
            textAlign: "center",
            fontSize: 14,
            fontWeight: "bold",
          },
          zlevel: 1,
        },
      ],
      animation: true,
      animationDuration: 500,
      universalTransition: true,
      emphasis: {
        scale: false,
        focus: "none",
      },
    };
  };

  const getBarOption = () => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: (params: any) => {
          const value = params[0].value;
          return `${params[0].name}: ${
            metric === "cost" ? `¥${value.toFixed(4)}` : `${value}次`
          }`;
        },
      },
      grid: {
        top: "8%",
        bottom: "12%",
        left: "3%",
        right: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: columnData.map((item) => item.nickname),
        axisLabel: {
          inside: false,
          color: "#666",
          fontSize: 12,
          rotate: 45,
          interval: "auto",
          overflow: "truncate",
          ellipsis: "...",
          hideOverlap: true,
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: "#ddd",
          },
        },
        z: 10,
      },
      yAxis: {
        type: "value",
        name: metric === "cost" ? "消耗金额" : "使用次数",
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: "#999",
        },
      },
      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: Math.min(100, Math.max(100 * (15 / columnData.length), 30)),
        },
      ],
      series: [
        {
          type: "bar",
          itemStyle: {
            color: "#5B9BD5",
            borderRadius: [5, 5, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: "#3A75B0",
            },
          },
          data: columnData.map((item) => item.value),
          showBackground: true,
          backgroundStyle: {
            color: "rgba(180, 180, 180, 0.1)",
          },
          label: {
            show: true,
            position: "top",
            formatter: (params: any) => {
              return metric === "cost"
                ? `¥${params.value.toFixed(2)}`
                : `${params.value}`;
            },
            fontSize: 12,
            color: "#666",
          },
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: "cubicInOut",
    };
  };

  // 处理图表实例
  const onChartReady = (instance: ECharts) => {
    chartRef.current = instance;
  };

  // 在组件中添加点击缩放功能
  const onBarChartReady = (instance: ECharts) => {
    const zoomSize = 6;
    instance.on("click", (params) => {
      const dataLength = columnData.length;
      instance.dispatchAction({
        type: "dataZoom",
        startValue:
          columnData[Math.max(params.dataIndex - zoomSize / 2, 0)].nickname,
        endValue:
          columnData[Math.min(params.dataIndex + zoomSize / 2, dataLength - 1)]
            .nickname,
      });
    });
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

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-700">模型使用分布</h2>
        {loading ? (
          <div className="flex justify-center items-center h-[450px] bg-gray-50 rounded-lg">
            <Spin size="large" />
          </div>
        ) : (
          <div className="h-[450px]">
            <ReactECharts
              option={getPieOption()}
              style={{ height: "100%", width: "100%" }}
              onChartReady={onChartReady}
            />
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-700">用户使用排行</h2>
        {loading ? (
          <div className="flex justify-center items-center h-[600px] bg-gray-50 rounded-lg">
            <Spin size="large" />
          </div>
        ) : (
          <div className="h-[600px]">
            <ReactECharts
              option={getBarOption()}
              style={{ height: "100%", width: "100%" }}
              onChartReady={onBarChartReady}
            />
          </div>
        )}
      </div>

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
