const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import routes
const authRoutes = require("./routes/authRoutes"); // Make sure the filename matches
app.use("/auth", authRoutes);  // This ensures "/auth/register" exists

// Test Route
app.get("/", (req, res) => {
  res.send("Auth service is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
