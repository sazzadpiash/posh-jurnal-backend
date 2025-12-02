import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - in production on Vercel, allow all origins since URL is dynamic
app.use(
	cors({
		origin: process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? true : "http://localhost:5173"),
		credentials: true,
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/journal", journalRoutes);

// Health check
app.get("/api/health", (req, res) => {
	res.json({ status: "ok", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(err.status || 500).json({
		message: err.message || "Internal server error",
		...(process.env.NODE_ENV === "development" && { stack: err.stack }),
	});
});

// Connect to MongoDB
const getMongoUri = () => {
	const mongoUri = process.env.MONGO_URI;
	const dbName = process.env.DB;

	if (!mongoUri) {
		throw new Error("MONGO_URI is not defined in environment variables");
	}

	if (!dbName) {
		return mongoUri;
	}

	// Parse the URI to handle database name
	try {
		const url = new URL(mongoUri);
		// Replace or set the pathname (database name)
		url.pathname = `/${dbName}`;
		return url.toString();
	} catch (error) {
		// If URL parsing fails, try simple string manipulation
		// Remove trailing slash if present
		let uri = mongoUri.endsWith("/") ? mongoUri.slice(0, -1) : mongoUri;
		// Check if URI already has a database name (after last /)
		const lastSlashIndex = uri.lastIndexOf("/");
		const afterLastSlash = uri.substring(lastSlashIndex + 1);

		// If the part after last slash looks like a database name (not a port or query), replace it
		if (lastSlashIndex > 0 && !afterLastSlash.includes("?") && !afterLastSlash.includes(":")) {
			uri = uri.substring(0, lastSlashIndex);
		}

		return `${uri}/${dbName}`;
	}
};

// Connect to MongoDB
const connectDB = async () => {
	try {
		await mongoose.connect(getMongoUri());
		console.log("Connected to MongoDB");
	} catch (error) {
		console.error("MongoDB connection error:", error);
		if (process.env.NODE_ENV !== "production") {
			process.exit(1);
		}
	}
};

// Connect to database
connectDB();

// Start server only if not in serverless environment (Vercel)
if (process.env.VERCEL !== "1") {
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

// Export for Vercel serverless functions
export default app;
