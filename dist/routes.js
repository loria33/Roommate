"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoomStatus = exports.getNotFound = exports.getInitConversations = exports.getConversations = exports.dashboard = exports.read = exports.wakeup = void 0;
const database_1 = require("./database");
const database_2 = require("./database");
const database_3 = require("./database");
const wakeup = async (req, res) => {
    try {
        res.status(200).json({
            message: "Server is awake and running!",
            timestamp: new Date().toISOString(),
            status: "OK",
        });
    }
    catch (error) {
        console.error("Wakeup endpoint error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.wakeup = wakeup;
const read = async (req, res) => {
    try {
        const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
        const tablesResult = await (0, database_1.query)(tablesQuery);
        const tables = tablesResult.rows.map((row) => row.table_name);
        const tablesData = {};
        for (const tableName of tables) {
            try {
                const dataQuery = `SELECT * FROM "${tableName}" LIMIT 100;`;
                const dataResult = await (0, database_1.query)(dataQuery);
                tablesData[tableName] = dataResult.rows;
            }
            catch (tableError) {
                console.error(`Error reading table ${tableName}:`, tableError);
                tablesData[tableName] = { error: "Unable to read table data" };
            }
        }
        res.status(200).json({
            message: "Database tables read successfully",
            timestamp: new Date().toISOString(),
            tables: tables,
            data: tablesData,
        });
    }
    catch (error) {
        console.error("Read endpoint error:", error);
        res.status(500).json({
            message: "Error reading database tables",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.read = read;
const dashboard = async (req, res) => {
    try {
        // Extremely fast metrics: scan only last 48h and use estimated total from pg_class
        const getCountsFast = async (tableName, timeColumn, exec) => {
            try {
                const sql48h = `
          WITH bounds AS (
            SELECT date_trunc('day', now()) AS today_start,
                   date_trunc('day', now()) - INTERVAL '1 day' AS yesterday_start
          )
          SELECT
            SUM(CASE WHEN ${timeColumn} >= b.today_start THEN 1 ELSE 0 END)::int AS today,
            SUM(CASE WHEN ${timeColumn} >= b.yesterday_start AND ${timeColumn} < b.today_start THEN 1 ELSE 0 END)::int AS yesterday
          FROM ${tableName} t
          CROSS JOIN bounds b
          WHERE ${timeColumn} >= (SELECT yesterday_start FROM bounds);
        `;
                const sqlTotalEstimate = `
          SELECT GREATEST(0, COALESCE(reltuples::bigint,0))::bigint AS estimate
          FROM pg_class WHERE relname = '${tableName}' LIMIT 1;
        `;
                const [r48, rTot] = await Promise.all([
                    exec(sql48h),
                    exec(sqlTotalEstimate),
                ]);
                const today = parseInt(String(r48.rows[0]?.today || 0), 10);
                const yesterday = parseInt(String(r48.rows[0]?.yesterday || 0), 10);
                const total = parseInt(String(rTot.rows[0]?.estimate || 0), 10);
                const delta = today - yesterday;
                const usagePercent = yesterday > 0 ? (delta / yesterday) * 100 : today > 0 ? 100 : 0;
                return { total, today, yesterday, delta, usagePercent };
            }
            catch (_) {
                return { total: 0, today: 0, yesterday: 0, delta: 0, usagePercent: 0 };
            }
        };
        const execPrimary = (sql) => (0, database_1.query)(sql);
        // Primary DB metrics (3 lightweight queries)
        const [conversationsRaw, initConversationsRaw, notFoundRaw] = await Promise.all([
            getCountsFast("conversations", "created_at", execPrimary),
            getCountsFast("initconversations", "created_at", execPrimary),
            getCountsFast("not_found", "ts", execPrimary),
        ]);
        // Apply requested delta semantics
        const conversations = {
            ...conversationsRaw,
            delta: conversationsRaw.today,
        };
        const initConversations = {
            ...initConversationsRaw,
            delta: initConversationsRaw.today,
        };
        const notFound = {
            ...notFoundRaw,
            delta: notFoundRaw.yesterday - notFoundRaw.today,
        };
        // Total users (no delta)
        let totalUsersCount = 0;
        try {
            const usersQuery = `SELECT COUNT(*) as count FROM user_assistants`;
            const usersResult = await (0, database_1.query)(usersQuery);
            totalUsersCount = parseInt(usersResult.rows[0]?.count || "0");
        }
        catch (error) {
            console.log("User assistants table not found or error:", error);
        }
        // Optional secondary DB metrics (3 lightweight queries)
        let externalMetrics = null;
        if (database_2.hasSecondaryDb) {
            try {
                const execSecondary = (sql) => (0, database_2.querySecondary)(sql);
                const [extConvRaw, extInitRaw, extNotFoundRaw] = await Promise.all([
                    getCountsFast("conversations", "created_at", execSecondary),
                    getCountsFast("initconversations", "created_at", execSecondary),
                    getCountsFast("not_found", "ts", execSecondary),
                ]);
                externalMetrics = {
                    conversations: { ...extConvRaw, delta: extConvRaw.today },
                    initConversations: { ...extInitRaw, delta: extInitRaw.today },
                    notFound: {
                        ...extNotFoundRaw,
                        delta: extNotFoundRaw.yesterday - extNotFoundRaw.today,
                    },
                };
            }
            catch (error) {
                console.log("Secondary DB metrics error:", error);
                externalMetrics = null;
            }
        }
        // Website DB metrics (sequential, each with 1.5s timeout)
        let website = null;
        if (database_3.hasWebsiteDb) {
            website = {};
            const execWebsite = (sql) => (0, database_3.queryWebsite)(sql);
            const withTimeout = async (p, ms, fallback) => Promise.race([
                p,
                new Promise((r) => setTimeout(() => r(fallback), ms)),
            ]);
            const fallback = {
                total: 0,
                today: 0,
                yesterday: 0,
                delta: 0,
                usagePercent: 0,
            };
            const leadsRaw = await withTimeout(getCountsFast("leads", "created_at", execWebsite), 1500, fallback);
            const featureRequestsRaw = await withTimeout(getCountsFast("feature_requests", "created_at", execWebsite), 1500, fallback);
            const languageRequestsRaw = await withTimeout(getCountsFast("language_requests", "created_at", execWebsite), 1500, fallback);
            // Website deltas are new items today
            website.leads = { ...leadsRaw, delta: leadsRaw.today };
            website.featureRequests = {
                ...featureRequestsRaw,
                delta: featureRequestsRaw.today,
            };
            website.languageRequests = {
                ...languageRequestsRaw,
                delta: languageRequestsRaw.today,
            };
        }
        const total = conversations.total + initConversations.total + notFound.total;
        res.status(200).json({
            conversations,
            initConversations,
            notFound,
            totalUsers: totalUsersCount,
            total,
            external: externalMetrics,
            website,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Dashboard endpoint error:", error);
        res.status(500).json({
            message: "Error fetching dashboard data",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.dashboard = dashboard;
const getConversations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 40;
        const offset = (page - 1) * limit;
        const conversationsQuery = `
      SELECT * FROM conversations 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
        const countQuery = `SELECT COUNT(*) as total FROM conversations`;
        const [conversationsResult, countResult] = await Promise.all([
            (0, database_1.query)(conversationsQuery, [limit, offset]),
            (0, database_1.query)(countQuery),
        ]);
        const total = parseInt(countResult.rows[0]?.total || "0");
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            data: conversationsResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });
    }
    catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({
            message: "Error fetching conversations",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getConversations = getConversations;
const getInitConversations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 40;
        const offset = (page - 1) * limit;
        const initConversationsQuery = `
      SELECT * FROM initconversations 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
        const countQuery = `SELECT COUNT(*) as total FROM initconversations`;
        const [initConversationsResult, countResult] = await Promise.all([
            (0, database_1.query)(initConversationsQuery, [limit, offset]),
            (0, database_1.query)(countQuery),
        ]);
        const total = parseInt(countResult.rows[0]?.total || "0");
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            data: initConversationsResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });
    }
    catch (error) {
        console.error("Get init conversations error:", error);
        res.status(500).json({
            message: "Error fetching init conversations",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getInitConversations = getInitConversations;
const getNotFound = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 40;
        const offset = (page - 1) * limit;
        const notFoundQuery = `
      SELECT * FROM not_found 
      ORDER BY ts DESC 
      LIMIT $1 OFFSET $2
    `;
        const countQuery = `SELECT COUNT(*) as total FROM not_found`;
        const [notFoundResult, countResult] = await Promise.all([
            (0, database_1.query)(notFoundQuery, [limit, offset]),
            (0, database_1.query)(countQuery),
        ]);
        const total = parseInt(countResult.rows[0]?.total || "0");
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            data: notFoundResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });
    }
    catch (error) {
        console.error("Get not found error:", error);
        res.status(500).json({
            message: "Error fetching not found data",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getNotFound = getNotFound;
/**
 * Update an existing room status entry
 */
const updateRoomStatus = async (req, res) => {
    try {
        const { room_number, room_status } = req.body;
        // Validate input
        if (!room_number || typeof room_number !== "string") {
            return res.status(400).json({
                message: "Invalid room number. Room number must be a non-empty string.",
            });
        }
        // Validate room status against allowed values
        const validStatuses = [
            "CLEAN_START",
            "CLEAN_DONE",
            "READY",
            "EXTRA_TIME",
            "FIX_START",
            "RESTOCK_FRIDGE",
        ];
        if (!validStatuses.includes(room_status)) {
            return res.status(400).json({
                message: `Invalid room status. Status must be one of: ${validStatuses.join(", ")}`,
            });
        }
        // Check if room already exists
        const checkQuery = `
      SELECT id FROM roomstatus 
      WHERE room_number = $1
    `;
        const checkResult = await (0, database_1.query)(checkQuery, [room_number]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: `Room number ${room_number} not found. Cannot update status for non-existent room.`,
            });
        }
        // Update existing record
        const updateQuery = `
      UPDATE roomstatus 
      SET room_status = $1, lastupdate = CURRENT_TIMESTAMP
      WHERE room_number = $2
      RETURNING *
    `;
        const result = await (0, database_1.query)(updateQuery, [room_status, room_number]);
        res.status(200).json({
            message: "Room status updated successfully",
            data: result.rows[0],
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Update room status error:", error);
        res.status(500).json({
            message: "Error updating room status",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.updateRoomStatus = updateRoomStatus;
//# sourceMappingURL=routes.js.map