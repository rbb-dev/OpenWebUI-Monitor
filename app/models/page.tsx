"use client";

import { useState, useEffect } from "react";
import { Table, Input, message, Tooltip, Button, Upload, Space } from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
  ExperimentOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";
import Link from "next/link";

interface ModelResponse {
  id: string;
  name: string;
  imageUrl: string;
  input_price: number;
  output_price: number;
}

interface Model {
  id: string;
  name: string;
  imageUrl: string;
  input_price: number;
  output_price: number;
  testStatus?: "success" | "error" | "testing";
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: "input_price" | "output_price";
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/v1/models");
        if (!response.ok) {
          throw new Error("获取模型失败");
        }
        const data = (await response.json()) as ModelResponse[];
        setModels(
          data.map((model: ModelResponse) => ({
            ...model,
            input_price: model.input_price || 60,
            output_price: model.output_price || 60,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch("/api/config/key");
        if (response.ok) {
          const data = await response.json();
          setApiKey(data.apiKey);
        }
      } catch (error) {
        console.error("获取 API Key 失败:", error);
      }
    };

    fetchApiKey();
  }, []);

  const handlePriceUpdate = async (
    id: string,
    field: "input_price" | "output_price",
    value: number
  ) => {
    try {
      const model = models.find((m) => m.id === id);
      if (!model) return;

      const validValue = Number(value);
      if (!isFinite(validValue) || validValue < 0) {
        throw new Error("请输入有效的正数");
      }

      const input_price =
        field === "input_price" ? validValue : model.input_price;
      const output_price =
        field === "output_price" ? validValue : model.output_price;

      const response = await fetch("/api/v1/models/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            {
              id,
              input_price: Number(input_price),
              output_price: Number(output_price),
            },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "更新价格失败");

      if (data.results && data.results[0]?.success) {
        setModels((prevModels) =>
          prevModels.map((model) =>
            model.id === id
              ? {
                  ...model,
                  input_price: Number(data.results[0].data.input_price),
                  output_price: Number(data.results[0].data.output_price),
                }
              : model
          )
        );
        message.success("价格更新成功");
      } else {
        throw new Error(data.results[0]?.error || "更新价格失败");
      }

      setEditingCell(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "更新价格失败");
      setEditingCell(null);
    }
  };

  const renderPriceCell = (
    field: "input_price" | "output_price",
    record: Model
  ) => {
    const isEditing =
      editingCell?.id === record.id && editingCell?.field === field;
    const currentValue = Number(record[field]);

    return isEditing ? (
      <Input
        defaultValue={currentValue.toFixed(2)}
        className="w-28 sm:w-36"
        onPressEnter={(e: React.KeyboardEvent<HTMLInputElement>) => {
          const numValue = Number(e.currentTarget.value);
          if (isFinite(numValue) && numValue >= 0) {
            handlePriceUpdate(record.id, field, numValue);
          } else {
            message.error("请输入有效的正数");
            setEditingCell(null);
          }
        }}
        onBlur={(e) => {
          const value = e.target.value;
          const numValue = Number(value);
          if (
            value &&
            !isNaN(numValue) &&
            numValue >= 0 &&
            numValue !== currentValue
          ) {
            handlePriceUpdate(record.id, field, numValue);
          } else {
            setEditingCell(null);
          }
        }}
        autoFocus
      />
    ) : (
      <div
        className="cursor-pointer font-medium text-blue-600"
        onClick={() => setEditingCell({ id: record.id, field })}
      >
        {currentValue.toFixed(2)}
      </div>
    );
  };

  const handleTestSingleModel = async (model: Model) => {
    try {
      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id ? { ...m, testStatus: "testing" } : m
        )
      );

      const result = await testModel(model);

      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id
            ? { ...m, testStatus: result.success ? "success" : "error" }
            : m
        )
      );
    } catch (error) {
      setModels((prev) =>
        prev.map((m) => (m.id === model.id ? { ...m, testStatus: "error" } : m))
      );
    }
  };

  const columns: ColumnsType<Model> = [
    {
      title: "模型",
      key: "model",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-3 relative">
          <div
            className="relative cursor-pointer"
            onClick={() => handleTestSingleModel(record)}
          >
            {record.imageUrl && (
              <Image
                src={record.imageUrl}
                alt={record.name}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            )}
            {record.testStatus && (
              <div className="absolute -top-1 -right-1">
                {record.testStatus === "testing" && (
                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  </div>
                )}
                {record.testStatus === "success" && (
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckOutlined className="text-[10px] text-green-500" />
                  </div>
                )}
                {record.testStatus === "error" && (
                  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                    <CloseOutlined className="text-[10px] text-red-500" />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="font-medium min-w-0 flex-1">
            <div className="truncate">{record.name}</div>
            <div className="text-xs text-gray-500 truncate opacity-60">
              {record.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "输入价格 ¥ / M tokens",
      key: "input_price",
      width: 150,
      dataIndex: "input_price",
      sorter: (a, b) => a.input_price - b.input_price,
      sortDirections: ["descend", "ascend", "descend"],
      render: (_, record) => renderPriceCell("input_price", record),
    },
    {
      title: "输出价格 ¥ / M tokens",
      key: "output_price",
      width: 150,
      dataIndex: "output_price",
      sorter: (a, b) => a.output_price - b.output_price,
      sortDirections: ["descend", "ascend", "descend"],
      render: (_, record) => renderPriceCell("output_price", record),
    },
  ];

  const handleExportPrices = () => {
    const priceData = models.map((model) => ({
      id: model.id,
      input_price: model.input_price,
      output_price: model.output_price,
    }));

    const blob = new Blob([JSON.stringify(priceData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model_prices_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportPrices = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        if (!Array.isArray(importedData)) {
          throw new Error("导入的数据格式不正确");
        }

        const validUpdates = importedData.filter((item) =>
          models.some((model) => model.id === item.id)
        );

        const response = await fetch("/api/v1/models/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates: validUpdates,
          }),
        });

        if (!response.ok) {
          throw new Error("批量更新价格失败");
        }

        const data = await response.json();
        console.log("服务器返回的更新结果:", data);

        if (data.results) {
          setModels((prevModels) =>
            prevModels.map((model) => {
              const update = data.results.find(
                (r: any) => r.id === model.id && r.success && r.data
              );
              if (update) {
                return {
                  ...model,
                  input_price: Number(update.data.input_price),
                  output_price: Number(update.data.output_price),
                };
              }
              return model;
            })
          );
        }

        message.success(
          `成功更新 ${
            data.results.filter((r: any) => r.success).length
          } 个模型的价格`
        );
      } catch (err) {
        console.error("导入失败:", err);
        message.error(err instanceof Error ? err.message : "导入失败");
      }
    };
    reader.readAsText(file);
    return false;
  };

  const testModel = async (
    model: Model
  ): Promise<{
    id: string;
    success: boolean;
    error?: string;
  }> => {
    if (!apiKey) {
      return {
        id: model.id,
        success: false,
        error: "API Key 未获取",
      };
    }

    try {
      const response = await fetch("/api/v1/models/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          modelId: model.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "测试失败");
      }

      return {
        id: model.id,
        success: true,
      };
    } catch (error) {
      return {
        id: model.id,
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  };

  const handleTestModels = async () => {
    if (!apiKey) {
      message.error("API Key 未获取，无法进行测试");
      return;
    }

    try {
      console.log("开始测试所有模型...");

      // 将所有模型设置为测试中状态
      setModels((prev) => prev.map((m) => ({ ...m, testStatus: "testing" })));
      setTesting(true);

      // 创建所有测试请求，但不等待它们全部完成
      models.forEach(async (model) => {
        try {
          const result = await testModel(model);
          // 更新单个模型的状态，但保持其他正在测试的模型的状态
          setModels((prev) =>
            prev.map((m) =>
              m.id === model.id
                ? { ...m, testStatus: result.success ? "success" : "error" }
                : m
            )
          );
        } catch (error) {
          // 如果单个模型测试失败，更新其状态，但保持其他正在测试的模型的状态
          setModels((prev) =>
            prev.map((m) =>
              m.id === model.id ? { ...m, testStatus: "error" } : m
            )
          );
        }
      });

      // 不再在这里设置 setTesting(false)，让按钮保持加载状态
      message.info("测试已开始，结果将逐个显示");

      // 创建一个 Promise 数组来跟踪所有测试
      const testPromises = models.map((model) =>
        testModel(model).catch((error) => ({
          id: model.id,
          success: false,
          error: error instanceof Error ? error.message : "未知错误",
        }))
      );

      // 等待所有测试完成后再关闭加载状态
      await Promise.all(testPromises);
    } catch (error) {
      console.error("测试过程出错:", error);
      message.error("测试过程出错");
    } finally {
      // 所有测试完成后再关闭加载状态
      setTesting(false);
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="pt-16 text-2xl font-semibold text-gray-900">模型管理</h1>
        <p className="mt-2 text-sm text-gray-500">
          管理所有可用模型的价格配置。点击模型图标可进行单独测试，测试结果将显示在图标右上角。
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <Tooltip title="批量测试所有模型的可用性">
            <Button
              icon={<ExperimentOutlined />}
              onClick={handleTestModels}
              loading={testing}
              type="primary"
              size="middle"
              className="shadow-sm hover:opacity-90"
            >
              测试全部模型
            </Button>
          </Tooltip>

          <Tooltip
            title={
              <div className="p-1.5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-blue-500 border-t-transparent animate-spin" />
                    </div>
                    <span className="text-xs text-gray-500">测试进行中</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckOutlined className="text-[9px] text-green-500" />
                    </div>
                    <span className="text-xs text-gray-500">测试通过</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                      <CloseOutlined className="text-[9px] text-red-500" />
                    </div>
                    <span className="text-xs text-gray-500">测试失败</span>
                  </div>
                </div>
              </div>
            }
            placement="bottomRight"
            color="white"
            overlayClassName="custom-tooltip-simple"
            overlayStyle={{
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
            mouseEnterDelay={0}
            mouseLeaveDelay={0.1}
          >
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              className="text-gray-400 hover:text-gray-500 hover:bg-gray-50 transition-colors ml-1"
            />
          </Tooltip>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            size="middle"
            onClick={handleExportPrices}
            className="flex-1 sm:w-[120px] items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-300 shadow-sm transition-all duration-200 hover:shadow"
          >
            <span className="flex items-center gap-2">
              <DownloadOutlined className="text-gray-500" />
              <span> 导出配置</span>
            </span>
          </Button>
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={handleImportPrices}
          >
            <Button
              size="middle"
              className="flex-1 sm:w-[120px] items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-300 shadow-sm transition-all duration-200 hover:shadow"
            >
              <span className="flex items-center gap-2">
                <UploadOutlined className="text-blue-500" />
                <span> 导入配置</span>
              </span>
            </Button>
          </Upload>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={models}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        className="bg-white rounded-lg shadow-sm 
          [&_.ant-table]:!border-b-0 
          [&_.ant-table-container]:!rounded-lg 
          [&_.ant-table-container]:!border-hidden
          [&_.ant-table-cell]:!border-gray-100 
          [&_.ant-table-thead_.ant-table-cell]:!bg-gray-50/80
          [&_.ant-table-thead_.ant-table-cell]:!text-gray-600
          [&_.ant-table-thead_.ant-table-cell]:!font-medium
          [&_.ant-table-row:hover>*]:!bg-blue-50/50
          [&_.ant-table-tbody_.ant-table-row]:!cursor-pointer
          [&_.ant-table-tbody_.ant-table-cell]:!py-4
          [&_.ant-table-column-sorter-up.active_.anticon]:!text-blue-500
          [&_.ant-table-column-sorter-down.active_.anticon]:!text-blue-500"
        scroll={{ x: 500 }}
      />
    </div>
  );
}
