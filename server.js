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
// CORS configuration
const corsOptions = {
	credentials: true,
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) return callback(null, true);

		const allowedOrigins = process.env.CLIENT_URL
			? process.env.CLIENT_URL.split(",").map((url) => url.trim())
			: process.env.NODE_ENV === "production"
			? [] // In production, require CLIENT_URL to be set
			: ["http://localhost:5173", "http://localhost:3000"];

		// If CLIENT_URL is not set in production, allow all (for Vercel dynamic URLs)
		// This is less secure but necessary if frontend URL is dynamic
		if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
			return callback(null, true);
		}

		if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.length === 0) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
};

app.use(cors(corsOptions));
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

// Validate required environment variables
const validateEnv = () => {
	const required = ["MONGO_URI", "JWT_SECRET"];
	const missing = required.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		console.error(`Missing required environment variables: ${missing.join(", ")}`);
		if (process.env.NODE_ENV !== "production") {
			process.exit(1);
		}
		throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
	}
};

// Connect to MongoDB
const connectDB = async () => {
	try {
		const mongoUri = getMongoUri();
		await mongoose.connect(mongoUri);
		console.log("Connected to MongoDB");

		// Handle connection events
		mongoose.connection.on("error", (err) => {
			console.error("MongoDB connection error:", err);
		});

		mongoose.connection.on("disconnected", () => {
			console.warn("MongoDB disconnected");
		});
	} catch (error) {
		console.error("MongoDB connection error:", error);
		// In production (Vercel), don't exit - let the serverless function handle it
		// The connection will be retried on next request
		if (process.env.NODE_ENV !== "production") {
			process.exit(1);
		}
	}
};

// Validate environment variables before starting
validateEnv();

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
