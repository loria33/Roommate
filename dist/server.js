"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = require("./routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "3001", 10);
const isDevelopment = process.env.NODE_ENV !== "production";
// Middleware
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://roaring-lokum-1e6a2c.netlify.app",
        "https://matalkoperationalbe-production.up.railway.app",
        "https://matalkoperationalbe.railway.internal",
        "https://matalkoperationalbe.railway.app",
        process.env.FRONTEND_URL,
    ].filter((url) => Boolean(url)),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});
// Test endpoint for debugging
app.get("/test", (req, res) => {
    res.status(200).json({
        message: "Backend is reachable!",
        timestamp: new Date().toISOString(),
        headers: req.headers,
    });
});
// Wakeup endpoint
app.get("/wakeup", (req, res) => {
    res
        .status(200)
        .json({ message: "Server is awake", timestamp: new Date().toISOString() });
});
// Room status endpoint
app.post("/room-status", routes_1.updateRoomStatus);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        message: "Internal server error",
        error: err.message,
    });
});
// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        message: "Endpoint not found",
        availableEndpoints: ["/wakeup", "/room-status"],
    });
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`⏰ Wakeup endpoint: http://localhost:${PORT}/wakeup`);
    // Initialize database tables - Removed as table already exists
});
//# sourceMappingURL=server.js.map