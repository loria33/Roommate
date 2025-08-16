import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { updateRoomStatus } from "./routes";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const isDevelopment = process.env.NODE_ENV !== "production";

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://roaring-lokum-1e6a2c.netlify.app",
      "https://matalkoperationalbe-production.up.railway.app",
      "https://matalkoperationalbe.railway.internal",
      "https://matalkoperationalbe.railway.app",
      process.env.FRONTEND_URL,
    ].filter((url): url is string => Boolean(url)),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

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
app.post("/room-status", updateRoomStatus);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
);

// 404 handler
app.use("*", (req: express.Request, res: express.Response) => {
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
