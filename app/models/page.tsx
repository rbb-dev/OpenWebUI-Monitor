"use client";

import { useState, useEffect } from "react";
import { Table, Input, message, Tooltip } from "antd";
import {
  DownloadOutlined,
  ExperimentOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  UpOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TestProgress } from "../../components/models/TestProgress";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cva } from "class-variance-authority";
import { Progress } from "antd";

interface ModelResponse {
  id: string;
  name: string;
  imageUrl: string;
  input_price: number;
  output_price: number;
  per_msg_price: number;
}

interface Model {
  id: string;
  name: string;
  imageUrl: string;
  input_price: number;
  output_price: number;
  per_msg_price: number;
  testStatus?: "success" | "error" | "testing";
}

// 添加测试状态指示器组件
const TestStatusIndicator = ({ status }: { status: Model["testStatus"] }) => {
  if (!status) return null;

  const variants = {
    testing: {
      container: "bg-blue-100",
      icon: "w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin",
    },
    success: {
      container: "bg-green-100",
      icon: "text-[10px] text-green-500",
    },
    error: {
      container: "bg-red-100",
      icon: "text-[10px] text-red-500",
    },
  };

  const variant = variants[status];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`w-4 h-4 rounded-full ${variant.container} flex items-center justify-center`}
    >
      {status === "testing" ? (
        <div className={variant.icon} />
      ) : status === "success" ? (
        <CheckOutlined className={variant.icon} />
      ) : (
        <CloseOutlined className={variant.icon} />
      )}
    </motion.div>
  );
};

// 添加测试进度组件
const TestProgressPanel = ({
  isVisible,
  models,
  isComplete,
  t,
}: {
  isVisible: boolean;
  models: Model[];
  isComplete: boolean;
  t: (key: string) => string;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const successCount = models.filter((m) => m.testStatus === "success").length;
  const errorCount = models.filter((m) => m.testStatus === "error").length;
  const testingCount = models.filter((m) => m.testStatus === "testing").length;
  const totalCount = models.length;
  const progress = Math.round(((successCount + errorCount) / totalCount) * 100);

  // 当开始新的测试时自动展开
  useEffect(() => {
    if (testingCount > 0) {
      setIsExpanded(true);
    }
  }, [testingCount]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-xl bg-card border shadow-sm overflow-hidden"
        >
          <div className="p-6 space-y-6">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">
                  {isComplete
                    ? t("models.testComplete")
                    : t("models.testingModels")}
                </h3>
                <TestStatusIndicator
                  status={
                    testingCount > 0
                      ? "testing"
                      : isComplete
                      ? "success"
                      : "error"
                  }
                />
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <UpOutlined className="text-lg text-muted-foreground" />
              </motion.div>
            </div>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-4">
                    <Progress
                      percent={progress}
                      strokeColor={{
                        "0%": "#4F46E5",
                        "100%": "#10B981",
                      }}
                      trailColor="#E5E7EB"
                      className="!m-0"
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <div className="text-2xl font-semibold text-green-500">
                          {successCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("models.testSuccess")}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-semibold text-red-500">
                          {errorCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("models.testFailed")}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-semibold text-blue-500">
                          {testingCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("models.testing")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                        },
                      },
                    }}
                  >
                    {models.map((model) => (
                      <motion.div
                        key={model.id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                      >
                        <Image
                          src={model.imageUrl}
                          alt={model.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {model.name}
                          </div>
                        </div>
                        <TestStatusIndicator status={model.testStatus} />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function ModelsPage() {
  const { t } = useTranslation("common");
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: "input_price" | "output_price" | "per_msg_price";
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showTestStatus, setShowTestStatus] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/v1/models");
        if (!response.ok) {
          throw new Error(t("error.model.failToFetchModels"));
        }
        const data = (await response.json()) as ModelResponse[];
        setModels(
          data.map((model: ModelResponse) => ({
            ...model,
            input_price: model.input_price ?? 60,
            output_price: model.output_price ?? 60,
            per_msg_price: model.per_msg_price ?? -1,
          }))
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("error.model.unknownError")
        );
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
        if (!response.ok) {
          throw new Error(
            `${t("error.model.failToFetchApiKey")}: ${response.status}`
          );
        }
        const data = await response.json();
        if (!data.apiKey) {
          throw new Error(t("error.model.ApiKeyNotConfigured"));
        }
        setApiKey(data.apiKey);
      } catch (error) {
        console.error(t("error.model.failToFetchApiKey"), error);
        message.error(
          error instanceof Error
            ? error.message
            : t("error.model.failToFetchApiKey")
        );
      }
    };

    fetchApiKey();
  }, []);

  const handlePriceUpdate = async (
    id: string,
    field: "input_price" | "output_price" | "per_msg_price",
    value: number
  ) => {
    try {
      const model = models.find((m) => m.id === id);
      if (!model) return;

      const validValue = Number(value);
      if (
        field !== "per_msg_price" &&
        (!isFinite(validValue) || validValue < 0)
      ) {
        throw new Error(t("error.model.nonePositiveNumber"));
      }
      if (field === "per_msg_price" && !isFinite(validValue)) {
        throw new Error(t("error.model.invalidNumber"));
      }

      const input_price =
        field === "input_price" ? validValue : model.input_price;
      const output_price =
        field === "output_price" ? validValue : model.output_price;
      const per_msg_price =
        field === "per_msg_price" ? validValue : model.per_msg_price;

      const response = await fetch("/api/v1/models/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            {
              id,
              input_price: Number(input_price),
              output_price: Number(output_price),
              per_msg_price: Number(per_msg_price),
            },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || t("error.model.priceUpdateFail"));

      if (data.results && data.results[0]?.success) {
        setModels((prevModels) =>
          prevModels.map((model) =>
            model.id === id
              ? {
                  ...model,
                  input_price: Number(data.results[0].data.input_price),
                  output_price: Number(data.results[0].data.output_price),
                  per_msg_price: Number(data.results[0].data.per_msg_price),
                }
              : model
          )
        );
        message.success(t("error.model.priceUpdateSuccess"));
      } else {
        throw new Error(
          data.results[0]?.error || t("error.model.priceUpdateFail")
        );
      }

      setEditingCell(null);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t("error.model.priceUpdateFail")
      );
      setEditingCell(null);
    }
  };

  const renderPriceCell = (
    field: "input_price" | "output_price" | "per_msg_price",
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
          if (
            field === "per_msg_price"
              ? isFinite(numValue)
              : isFinite(numValue) && numValue >= 0
          ) {
            handlePriceUpdate(record.id, field, numValue);
          } else {
            message.error(
              field === "per_msg_price"
                ? t("models.table.invalidNumber")
                : t("models.table.nonePositiveNumber")
            );
            setEditingCell(null);
          }
        }}
        onBlur={(e) => {
          const value = e.target.value;
          const numValue = Number(value);
          if (
            value &&
            !isNaN(numValue) &&
            (field === "per_msg_price" ? isFinite(numValue) : numValue >= 0) &&
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
        {currentValue < 0 ? (
          <span className="text-gray-400">{t("models.table.notSet")}</span>
        ) : (
          currentValue.toFixed(2)
        )}
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
      title: t("models.table.name"),
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
      title: t("models.table.inputPrice"),
      key: "input_price",
      width: 150,
      dataIndex: "input_price",
      sorter: (a, b) => a.input_price - b.input_price,
      sortDirections: ["descend", "ascend", "descend"],
      render: (_, record) => renderPriceCell("input_price", record),
    },
    {
      title: t("models.table.outputPrice"),
      key: "output_price",
      width: 150,
      dataIndex: "output_price",
      sorter: (a, b) => a.output_price - b.output_price,
      sortDirections: ["descend", "ascend", "descend"],
      render: (_, record) => renderPriceCell("output_price", record),
    },
    {
      title: (
        <span>
          {t("models.table.perMsgPrice")}{" "}
          <Tooltip title={t("models.table.perMsgPriceTooltip")}>
            <InfoCircleOutlined className="text-gray-400 cursor-help" />
          </Tooltip>
        </span>
      ),
      key: "per_msg_price",
      width: 150,
      dataIndex: "per_msg_price",
      sorter: (a, b) => a.per_msg_price - b.per_msg_price,
      sortDirections: ["descend", "ascend", "descend"],
      render: (_, record) => renderPriceCell("per_msg_price", record),
    },
  ];

  const handleExportPrices = () => {
    const priceData = models.map((model) => ({
      id: model.id,
      input_price: model.input_price,
      output_price: model.output_price,
      per_msg_price: model.per_msg_price,
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
          throw new Error(t("error.model.invalidImportFormat"));
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
          throw new Error(t("error.model.batchPriceUpdateFail"));
        }

        const data = await response.json();
        console.log(t("error.model.serverResponse"), data);

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
                  per_msg_price: Number(update.data.per_msg_price),
                };
              }
              return model;
            })
          );
        }

        message.success(
          `${t("error.model.updateSuccess")} ${
            data.results.filter((r: any) => r.success).length
          } ${t("error.model.numberOfModelPrice")}`
        );
      } catch (err) {
        console.error(t("error.model.failToImport"), err);
        message.error(
          err instanceof Error ? err.message : t("error.model.failToImport")
        );
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
        error: t("error.model.ApiKeyNotFetched"),
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t("error.model.failToTest"));
      }

      return {
        id: model.id,
        success: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        id: model.id,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : t("error.model.unknownError"),
      };
    }
  };

  const handleTestModels = async () => {
    if (!apiKey) {
      message.error(t("error.model.failToTestWithoutApiKey"));
      return;
    }

    try {
      setModels((prev) => prev.map((m) => ({ ...m, testStatus: "testing" })));
      setTesting(true);
      setIsTestComplete(false);

      const testPromises = models.map((model) =>
        testModel(model).then((result) => {
          setModels((prev) =>
            prev.map((m) =>
              m.id === model.id
                ? { ...m, testStatus: result.success ? "success" : "error" }
                : m
            )
          );
          return result;
        })
      );

      await Promise.all(testPromises);
      setIsTestComplete(true);
    } catch (error) {
      console.error(t("error.model.failToTest"), error);
      message.error(t("error.model.failToTest"));
    } finally {
      setTesting(false);
    }
  };

  // 添加自定义渲染的卡片组件
  const MobileCard = ({ record }: { record: Model }) => {
    return (
      <div className="p-6 bg-card rounded-lg border shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="relative cursor-pointer"
            onClick={() => handleTestSingleModel(record)}
          >
            {record.imageUrl && (
              <Image
                src={record.imageUrl}
                alt={record.name}
                width={48}
                height={48}
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
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{record.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {record.id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground block">
              {t("models.table.mobile.inputPrice")}
            </span>
            <div className="p-2 rounded-md bg-muted/50 text-center">
              {renderPriceCell("input_price", record)}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground block">
              {t("models.table.mobile.outputPrice")}
            </span>
            <div className="p-2 rounded-md bg-muted/50 text-center">
              {renderPriceCell("output_price", record)}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground block">
              {t("models.table.mobile.perMsgPrice")}
            </span>
            <div className="p-2 rounded-md bg-muted/50 text-center">
              {renderPriceCell("per_msg_price", record)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6 sm:space-y-8">
      {/* 页面标题部分 */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("models.title")}
        </h1>
        <p className="text-muted-foreground">{t("models.description")}</p>
      </div>

      {/* 操作按钮组 */}
      <div className="flex flex-wrap gap-4">
        <Button
          variant="default"
          size="default"
          onClick={handleTestModels}
          className="relative flex items-center"
          disabled={testing && !isTestComplete}
        >
          <motion.div
            animate={testing ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mr-2"
          >
            <ExperimentOutlined className="h-4 w-4" />
          </motion.div>
          {testing ? t("models.testing") : t("models.testAll")}
        </Button>

        <Button
          variant="outline"
          size="default"
          onClick={handleExportPrices}
          className="flex items-center"
        >
          <DownloadOutlined className="mr-2 h-4 w-4" />
          {t("models.exportConfig")}
        </Button>

        <Button
          variant="outline"
          size="default"
          className="flex items-center"
          onClick={() => document.getElementById("import-input")?.click()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          {t("models.importConfig")}
        </Button>
        <input
          id="import-input"
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImportPrices(file);
            }
            e.target.value = "";
          }}
        />
      </div>

      {/* 替换原有的TestProgress组件 */}
      <TestProgressPanel
        isVisible={testing || isTestComplete}
        models={models}
        isComplete={isTestComplete}
        t={t}
      />

      {/* 桌面端表格视图 */}
      <div className="hidden sm:block rounded-lg border bg-card shadow-sm">
        <Table
          columns={columns}
          dataSource={models}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          className="[&_.ant-table]:!border-b-0 
            [&_.ant-table-container]:!rounded-lg 
            [&_.ant-table-container]:!border-hidden
            [&_.ant-table-cell]:!border-border
            [&_.ant-table-thead_.ant-table-cell]:!bg-muted/50
            [&_.ant-table-thead_.ant-table-cell]:!text-muted-foreground
            [&_.ant-table-thead_.ant-table-cell]:!font-medium
            [&_.ant-table-row:hover>*]:!bg-muted/50
            [&_.ant-table-tbody_.ant-table-row]:!cursor-pointer
            [&_.ant-table-tbody_.ant-table-cell]:!py-4"
          scroll={{ x: 500 }}
        />
      </div>

      {/* 移动端卡片视图 */}
      <div className="sm:hidden space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary animate-spin rounded-full"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {models.map((model) => (
              <MobileCard key={model.id} record={model} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
