"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/models");
      if (!response.ok) {
        throw new Error("获取模型失败");
      }
      const data = await response.json();
      setModels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (model: Model) => {
    try {
      const response = await fetch("/api/models", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: model.id,
          inputPrice: model.inputPrice,
          outputPrice: model.outputPrice,
        }),
      });

      if (!response.ok) {
        throw new Error("保存失败");
      }

      setEditingId(null);
      await fetchModels(); // 重新加载数据
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    }
  };

  if (loading) return <div className="p-4">加载中...</div>;
  if (error) return <div className="p-4 text-red-500">错误: {error}</div>;

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
                {editingId === model.id ? (
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="text-sm">输入价格:</label>
                      <input
                        type="number"
                        value={model.inputPrice}
                        onChange={(e) => {
                          const newModels = models.map((m) =>
                            m.id === model.id
                              ? { ...m, inputPrice: parseFloat(e.target.value) }
                              : m
                          );
                          setModels(newModels);
                        }}
                        className="ml-2 border rounded px-2 py-1 w-24"
                      />
                    </div>
                    <div>
                      <label className="text-sm">输出价格:</label>
                      <input
                        type="number"
                        value={model.outputPrice}
                        onChange={(e) => {
                          const newModels = models.map((m) =>
                            m.id === model.id
                              ? {
                                  ...m,
                                  outputPrice: parseFloat(e.target.value),
                                }
                              : m
                          );
                          setModels(newModels);
                        }}
                        className="ml-2 border rounded px-2 py-1 w-24"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(model)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-sm">输入价格: {model.inputPrice}</p>
                    <p className="text-sm">输出价格: {model.outputPrice}</p>
                    <button
                      onClick={() => setEditingId(model.id)}
                      className="mt-2 text-blue-500 text-sm"
                    >
                      编辑价格
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
