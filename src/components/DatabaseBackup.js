const DatabaseBackup = () => {
  const handleExport = async () => {
    try {
      const response = await fetch("/api/database/export", {
        method: "POST",
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "database_backup.sql";
      a.click();
    } catch (error) {
      console.error("导出失败:", error);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/database/import", {
        method: "POST",
        body: formData,
      });
      const result = await response.text();
      alert(result);
    } catch (error) {
      console.error("导入失败:", error);
    }
  };

  return (
    <div>
      <button onClick={handleExport}>导出数据库</button>
      <input type="file" onChange={handleImport} accept=".sql" />
    </div>
  );
};
