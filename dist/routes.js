"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoomStatus = exports.wakeup = void 0;
const database_1 = require("./database");
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