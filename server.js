const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import authentication routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes); // <-- This ensures "/auth/register" works

// Test Route
app.get("/", (req, res) => {
    res.send("Auth service is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
