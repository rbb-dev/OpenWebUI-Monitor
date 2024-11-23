import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { PoolClient } from "pg";

export async function POST(req: Request) {
  let client: PoolClient | null = null;

  try {
    const data = await req.json();

    // 验证数据格式并提供详细错误信息
    if (!data.version) {
      throw new Error("缺少版本信息(version)");
    }
    if (!data.data) {
      throw new Error("缺少数据对象(data)");
    }

    // 数据格式验证
    const validateData = (data: any) => {
      if (!data.users && !data.model_prices && !data.user_usage_records) {
        throw new Error("数据对象为空，至少需要包含一种数据类型");
      }

      // 验证用户数据格式
      if (data.users) {
        if (!Array.isArray(data.users)) {
          throw new Error("users 必须是数组格式");
        }
        data.users.forEach((user: any, index: number) => {
          if (!user.id || !user.email || !user.name) {
            throw new Error(
              `用户数据格式错误，位置: ${index}, 用户: ${JSON.stringify(user)}`
            );
          }
        });
      }

      // 验证模型价格数据格式
      if (data.model_prices) {
        if (!Array.isArray(data.model_prices)) {
          throw new Error("model_prices 必须是数组格式");
        }
        data.model_prices.forEach((price: any, index: number) => {
          if (!price.id || !price.name) {
            throw new Error(
              `模型价格数据格式错误，位置: ${index}, 数据: ${JSON.stringify(
                price
              )}`
            );
          }
        });
      }

      // 验证使用记录数据格式
      if (data.user_usage_records) {
        if (!Array.isArray(data.user_usage_records)) {
          throw new Error("user_usage_records 必须是数组格式");
        }
        data.user_usage_records.forEach((record: any, index: number) => {
          if (!record.user_id || !record.use_time || !record.model_name) {
            throw new Error(
              `使用记录数据格式错误，位置: ${index}, 记录: ${JSON.stringify(
                record
              )}`
            );
          }
        });
      }
    };

    validateData(data.data);

    // 获取数据库连接
    client = await pool.connect();

    // 开启事务
    await client.query("BEGIN");

    try {
      // 清空现有数据
      console.log("开始清空现有数据...");
      await client.query("TRUNCATE TABLE user_usage_records CASCADE");
      await client.query("TRUNCATE TABLE model_prices CASCADE");
      await client.query("TRUNCATE TABLE users CASCADE");
      console.log("数据清空完成");

      // 导入用户数据
      if (data.data.users?.length) {
        console.log(`开始导入 ${data.data.users.length} 条用户数据...`);
        for (const [index, user] of data.data.users.entries()) {
          try {
            await client.query(
              `INSERT INTO users (id, email, name, role, balance)
               VALUES ($1, $2, $3, $4, $5)`,
              [user.id, user.email, user.name, user.role, user.balance]
            );
          } catch (error) {
            throw new Error(
              `导入用户数据失败，位置: ${index}, 用户: ${JSON.stringify(
                user
              )}, 错误: ${error}`
            );
          }
        }
        console.log("用户数据导入完成");
      }

      // 导入模型价格
      if (data.data.model_prices?.length) {
        console.log(
          `开始导入 ${data.data.model_prices.length} 条模型价格数据...`
        );
        for (const [index, price] of data.data.model_prices.entries()) {
          try {
            await client.query(
              `INSERT INTO model_prices (id, name, input_price, output_price)
               VALUES ($1, $2, $3, $4)`,
              [price.id, price.name, price.input_price, price.output_price]
            );
          } catch (error) {
            throw new Error(
              `导入模型价格数据失败，位置: ${index}, 数据: ${JSON.stringify(
                price
              )}, 错误: ${error}`
            );
          }
        }
        console.log("模型价格数据导入完成");
      }

      // 导入使用记录
      if (data.data.user_usage_records?.length) {
        console.log(
          `开始导入 ${data.data.user_usage_records.length} 条使用记录...`
        );
        for (const [index, record] of data.data.user_usage_records.entries()) {
          try {
            await client.query(
              `INSERT INTO user_usage_records (
                user_id, nickname, use_time, model_name, 
                input_tokens, output_tokens, cost, balance_after
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                record.user_id,
                record.nickname,
                record.use_time,
                record.model_name,
                record.input_tokens,
                record.output_tokens,
                record.cost,
                record.balance_after,
              ]
            );
          } catch (error) {
            throw new Error(
              `导入使用记录失败，位置: ${index}, 记录: ${JSON.stringify(
                record
              )}, 错误: ${error}`
            );
          }
        }
        console.log("使用记录导入完成");
      }

      await client.query("COMMIT");
      console.log("所有数据导入成功");

      return NextResponse.json({
        success: true,
        message: "数据导入成功",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("导入数据库失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "导入数据库失败",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
