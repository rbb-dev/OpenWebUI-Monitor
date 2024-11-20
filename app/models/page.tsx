"use client";

import { useEffect, useState } from "react";
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
        const response = await fetch("/api/models");
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
    try {
      setSaving(id);
      const response = await fetch("/api/models/price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, inputPrice, outputPrice }),
      });

      if (!response.ok) {
        throw new Error("更新价格失败");
      }

      setModels(
        models.map((model) =>
          model.id === id ? { ...model, inputPrice, outputPrice } : model
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新价格失败");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">模型配置</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <div
            key={model.id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              {model.imageUrl && (
                <div className="w-12 h-12 relative">
                  <Image
                    src={model.imageUrl}
                    alt={model.name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="font-semibold">{model.name}</h2>
                <p className="text-sm text-gray-500">{model.id}</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm">输入价格:</label>
                    <input
                      type="number"
                      value={model.inputPrice}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value);
                        setModels(
                          models.map((m) =>
                            m.id === model.id
                              ? { ...m, inputPrice: newValue }
                              : m
                          )
                        );
                      }}
                      onBlur={() =>
                        handlePriceUpdate(
                          model.id,
                          model.inputPrice,
                          model.outputPrice
                        )
                      }
                      className="border rounded px-2 py-1 w-24 text-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm">输出价格:</label>
                    <input
                      type="number"
                      value={model.outputPrice}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value);
                        setModels(
                          models.map((m) =>
                            m.id === model.id
                              ? { ...m, outputPrice: newValue }
                              : m
                          )
                        );
                      }}
                      onBlur={() =>
                        handlePriceUpdate(
                          model.id,
                          model.inputPrice,
                          model.outputPrice
                        )
                      }
                      className="border rounded px-2 py-1 w-24 text-sm"
                    />
                  </div>
                </div>
                {saving === model.id && (
                  <p className="text-sm text-blue-500 mt-1">保存中...</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
