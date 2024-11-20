import { list, del } from "@vercel/blob";

export async function listBlobs() {
  try {
    const { blobs } = await list();
    return blobs;
  } catch (err) {
    console.error("获取文件列表失败:", err);
    throw err;
  }
}

export async function deleteBlob(url: string) {
  try {
    await del(url);
  } catch (err) {
    console.error("删除文件失败:", err);
    throw err;
  }
}
