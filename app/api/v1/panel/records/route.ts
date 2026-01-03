import { query } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { verifyApiToken } from "@/lib/auth";

export async function GET(req: Request) {
  const authError = verifyApiToken(req);
  if (authError) {
    return authError;
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const sortField = searchParams.get("sortField");
    const sortOrder = searchParams.get("sortOrder");
    const users = searchParams.get("users")?.split(",") || [];
    const models = searchParams.get("models")?.split(",") || [];
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const buildFilters = (opts: {
      users?: string[];
      models?: string[];
      startDate?: string | null;
      endDate?: string | null;
      includeUsers?: boolean;
      includeModels?: boolean;
    }) => {
      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      const includeUsers = opts.includeUsers ?? true;
      const includeModels = opts.includeModels ?? true;

      if (includeUsers && opts.users && opts.users.length > 0) {
        conditions.push(`nickname = ANY($${paramIndex})`);
        params.push(opts.users);
        paramIndex++;
      }

      if (includeModels && opts.models && opts.models.length > 0) {
        conditions.push(
          `COALESCE(mp.name, user_usage_records.model_name) = ANY($${paramIndex})`
        );
        params.push(opts.models);
        paramIndex++;
      }

      if (opts.startDate && opts.endDate) {
        conditions.push(
          `use_time >= $${paramIndex} AND use_time <= $${paramIndex + 1}`
        );
        params.push(opts.startDate, opts.endDate);
        paramIndex += 2;
      }

      return {
        whereClause:
          conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
        params,
        nextParamIndex: paramIndex,
      };
    };

    const recordFilters = buildFilters({
      users,
      models,
      startDate,
      endDate,
    });

    const sortFieldMap: Record<string, string> = {
      use_time: "use_time",
      nickname: "nickname",
      model_name: "model_name",
      input_tokens: "input_tokens",
      output_tokens: "output_tokens",
      tokens: "(input_tokens + output_tokens)",
      cost: "cost",
      balance_after: "balance_after",
    };

    const orderBy = sortField ? sortFieldMap[sortField] : undefined;
    const orderDir = sortOrder === "descend" ? "DESC" : "ASC";
    const orderClause = orderBy
      ? `ORDER BY ${orderBy} ${orderDir}`
      : "ORDER BY use_time DESC";

    const countQuery = `
      SELECT COUNT(*) 
      FROM user_usage_records LEFT JOIN model_prices AS mp ON mp.id = user_usage_records.model_name 
      ${recordFilters.whereClause}
    `;
    const countResult = await query(countQuery, recordFilters.params);

    const offset = (page - 1) * pageSize;
    const dataQuery = `
      SELECT 
        id,
        user_id,
        nickname,
        use_time,
        COALESCE(mp.name, user_usage_records.model_name) AS model_name,
        input_tokens,
        output_tokens,
        cost,
        balance_after
      FROM user_usage_records
      LEFT JOIN model_prices AS mp
        ON mp.id = user_usage_records.model_name
      ${recordFilters.whereClause}
      ${orderClause}
      LIMIT $${recordFilters.nextParamIndex} OFFSET $${recordFilters.nextParamIndex + 1}
    `;

    const dataParams = [...recordFilters.params, pageSize, offset];
    const records = await query(dataQuery, dataParams);

    const total = parseInt(countResult.rows[0].count);

    const modelFacetFilters = buildFilters({
      users,
      models,
      startDate,
      endDate,
      includeModels: false,
    });
    const modelsQuery = `
      SELECT DISTINCT
        COALESCE(mp.name, user_usage_records.model_name) AS model_name
      FROM user_usage_records
      LEFT JOIN model_prices AS mp
        ON mp.id = user_usage_records.model_name
      ${modelFacetFilters.whereClause}
      ORDER BY model_name ASC
    `;

    const userFacetFilters = buildFilters({
      users,
      models,
      startDate,
      endDate,
      includeUsers: false,
    });
    const usersQuery = `
      SELECT DISTINCT
        nickname
      FROM user_usage_records
      LEFT JOIN model_prices AS mp
        ON mp.id = user_usage_records.model_name
      ${userFacetFilters.whereClause}
      ORDER BY nickname ASC
    `;

    const [modelFacetResult, userFacetResult] = await Promise.all([
      query(modelsQuery, modelFacetFilters.params),
      query(usersQuery, userFacetFilters.params),
    ]);

    return NextResponse.json({
      records: records.rows,
      total,
      models: modelFacetResult.rows.map((row) => row.model_name as string),
      users: userFacetResult.rows.map((row) => row.nickname as string),
    });
  } catch (error) {
    console.error("Fail to fetch usage records:", error);
    return NextResponse.json(
      { error: "Fail to fetch usage records" },
      { status: 500 }
    );
  }
}
