"use client";

import { useState, useEffect } from "react";
import { Table, message, InputNumber } from "antd";
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
  inputPrice: number;
  outputPrice: number;
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

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
            inputPrice: model.input_price || 60,
            outputPrice: model.output_price || 60,
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
    inputPrice: number,
    outputPrice: number
  ) => {
    if (saving) return;

    try {
      setSaving(id);

      if (isNaN(inputPrice) || isNaN(outputPrice)) {
        throw new Error("价格必须是有效的数字");
      }

      const response = await fetch("/api/v1/models/price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          inputPrice: Number(inputPrice),
          outputPrice: Number(outputPrice),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "更新价格失败");
      }

      setModels(
        models.map((model) =>
          model.id === id
            ? {
                ...model,
                inputPrice: data.input_price,
                outputPrice: data.output_price,
              }
            : model
        )
      );

      message.success("价格更新成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "更新价格失败";
      message.error(errorMessage);
    } finally {
      setSaving(null);
    }
  };

  const columns: ColumnsType<Model> = [
    {
      title: "模型",
      key: "model",
      width: 300,
      fixed: "left",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          {record.imageUrl && (
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image
                src={record.imageUrl}
                alt={record.name}
                fill
                className="rounded-full object-cover"
              />
            </div>
          )}
          <div>
            <div className="font-semibold">{record.name}</div>
            <div className="text-xs text-gray-500">{record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: "输入价格 (￥/1M tokens)",
      key: "inputPrice",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <InputNumber
            value={record.inputPrice}
            onChange={(value) => {
              if (value === null) return;
              setModels(
                models.map((m) =>
                  m.id === record.id ? { ...m, inputPrice: value } : m
                )
              );
            }}
            onBlur={() =>
              handlePriceUpdate(
                record.id,
                record.inputPrice,
                record.outputPrice
              )
            }
            min={0}
            max={1000}
            step={0.000001}
            precision={6}
            style={{ width: "150px" }}
            prefix="￥"
            disabled={saving === record.id}
            controls={false}
          />
          {saving === record.id && (
            <span className="text-sm text-blue-500">保存中...</span>
          )}
        </div>
      ),
    },
    {
      title: "输出价格 (￥/1M tokens)",
      key: "outputPrice",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <InputNumber
            value={record.outputPrice}
            onChange={(value) => {
              if (value === null) return;
              setModels(
                models.map((m) =>
                  m.id === record.id ? { ...m, outputPrice: value } : m
                )
              );
            }}
            onBlur={() =>
              handlePriceUpdate(
                record.id,
                record.inputPrice,
                record.outputPrice
              )
            }
            min={0}
            max={1000}
            step={0.000001}
            precision={6}
            style={{ width: "150px" }}
            prefix="￥"
            disabled={saving === record.id}
            controls={false}
          />
        </div>
      ),
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
