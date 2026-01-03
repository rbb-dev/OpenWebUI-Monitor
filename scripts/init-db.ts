import { ensureTablesExist, getClient } from "../lib/db/client";

async function init() {
  try {
    await ensureTablesExist();
    console.log("Database initialized successfully");
    const client = await getClient();
    if (client && typeof (client as any).end === "function") {
      await (client as any).end();
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

init();
