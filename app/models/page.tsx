"use client";

import { useState, useEffect } from "react";
import { Table, Input, message, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";

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

      const validValue = Number(parseFloat(value.toFixed(6)));
      if (isNaN(validValue) || validValue < 0) {
        throw new Error("请输入有效的正数");
      }

      const input_price = Number(
        field === "input_price" ? validValue : model.input_price
      );
      const output_price = Number(
        field === "output_price" ? validValue : model.output_price
      );

      const response = await fetch("/api/v1/models/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          input_price: Number(input_price),
          output_price: Number(output_price),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "更新价格失败");

      setModels(
        models.map((model) =>
          model.id === id
            ? {
                ...model,
                input_price: Number(data.input_price),
                output_price: Number(data.output_price),
              }
            : model
        )
      );

      message.success("价格更新成功");
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
        style={{ width: "150px" }}
        onPressEnter={(e) => {
          const value = e.target.value;
          const numValue = Number(value);
          if (!isNaN(numValue) && numValue >= 0) {
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
        style={{ cursor: "pointer" }}
        onClick={() => setEditingCell({ id: record.id, field })}
      >
        ￥{currentValue.toFixed(2)}
      </div>
    );
  };

  const columns: ColumnsType<Model> = [
    {
      title: "模型",
      key: "model",
      width: 200,
      fixed: "left",
      render: (_, record) => (
        <Tooltip title={record.id}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              cursor: "pointer",
              height: "100%",
            }}
          >
            {record.imageUrl && (
              <Image
                src={record.imageUrl}
                alt={record.name}
                width={32}
                height={32}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            )}
            <div style={{ fontWeight: "medium", flexGrow: 1 }}>
              {record.name}
            </div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "输入价格 (￥/1M tokens)",
      key: "input_price",
      width: 200,
      render: (_, record) => renderPriceCell("input_price", record),
    },
    {
      title: "输出价格 (￥/1M tokens)",
      key: "output_price",
      width: 200,
      render: (_, record) => renderPriceCell("output_price", record),
    },
  ];

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">模型配置</h1>
      <Table
        columns={columns}
        dataSource={models}
        rowKey="id"
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: 800 }}
      />
    </div>
  );
}
