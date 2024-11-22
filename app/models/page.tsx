"use client";

import { useState, useEffect } from "react";
import { Table, Input, message, Tooltip, Button, Upload } from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
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
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: "input_price" | "output_price";
  } | null>(null);

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

  const columns: ColumnsType<Model> = [
    {
      title: "模型",
      key: "model",
      width: 200,
      render: (_, record) => (
        <Tooltip title={record.id}>
          <div className="flex items-center gap-3">
            {record.imageUrl && (
              <Image
                src={record.imageUrl}
                alt={record.name}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            )}
            <div className="font-medium min-w-0 flex-1">
              <div className="truncate">{record.name}</div>
              <div className="text-xs text-gray-500 truncate">{record.id}</div>
            </div>
          </div>
        </Tooltip>
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

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="mr-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftOutlined className="text-gray-600" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              模型配置
            </h1>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4 flex-wrap gap-2">
        <div className="space-x-2 sm:space-x-4">
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportPrices}
            size="middle"
            className="bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
          >
            导出价格
          </Button>
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={handleImportPrices}
          >
            <Button
              icon={<UploadOutlined />}
              size="middle"
              className="bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
            >
              导入价格
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
        className="bg-white rounded-lg shadow-sm [&_.ant-table]:!border-b-0 
          [&_.ant-table-container]:!rounded-lg [&_.ant-table-container]:!border-hidden
          [&_.ant-table-cell]:!border-gray-100 
          [&_.ant-table-thead_.ant-table-cell]:!bg-gray-50/80
          [&_.ant-table-thead_.ant-table-cell]:!text-gray-600
          [&_.ant-table-row:hover>*]:!bg-blue-50/50
          [&_.ant-table-tbody_.ant-table-row]:!cursor-pointer
          [&_.ant-table-column-sorter-up.active_.anticon]:!text-blue-500
          [&_.ant-table-column-sorter-down.active_.anticon]:!text-blue-500
          [&_.ant-table-filter-trigger.active]:!text-blue-500
          [&_.ant-table-filter-dropdown]:!rounded-lg
          [&_.ant-table-filter-dropdown]:!shadow-lg
          [&_.ant-table-filter-dropdown]:!border-gray-100"
        scroll={{ x: 500 }}
      />
    </div>
  );
}
