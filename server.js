const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// User Data Storage (Temporary In-Memory Storage)
let users = [];

// Signup Route
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = users.find(user => user.email === email);
        if (existingUser) return res.status(400).json({ message: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, email, password: hashedPassword };
        users.push(newUser);

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = users.find(user => user.email === email);
        if (!user) return res.status(400).json({ message: "User not found" });

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ email: user.email, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
        res.status(200).json({ token, username: user.username, email: user.email });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Profile Route
app.get("/profile", (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = users.find(user => user.email === decoded.email);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ username: user.username, email: user.email });
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
