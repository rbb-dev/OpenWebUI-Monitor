"use client";

import { useState, useRef, useEffect } from "react";

interface BlobFile {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export default function Home() {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取文件列表
  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files");
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setFiles(data.files || []);
    } catch (err) {
      setError("获取文件列表失败");
      console.error(err);
    }
  };

  // 上传文件
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileInputRef.current?.files?.length) {
      setError("请选择文件");
      return;
    }

    try {
      setUploading(true);
      const file = fileInputRef.current.files[0];

      const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) {
        throw new Error("上传失败");
      }

      const blob = await response.json();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchFiles();
    } catch (err) {
      console.error("文件上传失败:", err);
      setError("文件上传失败");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">文件列表</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <div className="flex items-center space-x-2">
          <input type="file" ref={fileInputRef} className="border p-2" />
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300"
          >
            {uploading ? "上传中..." : "上传"}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.pathname} className="border p-4 rounded">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {file.pathname}
            </a>
            <div className="text-sm text-gray-500 mt-1">
              <span>大小: {(file.size / 1024).toFixed(2)} KB</span>
              <span className="ml-4">
                上传时间: {new Date(file.uploadedAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
