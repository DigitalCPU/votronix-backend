const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const Brevo = require("@getbrevo/brevo");

// ✅ Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// ✅ Configure MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://your-username:your-password@cluster0.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Configure Brevo API
const brevoClient = new Brevo.ApiClient.instance;
const apiKey = brevoClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// ✅ Signup Route
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    // 📩 Send Confirmation Email using Brevo
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: "Votronix", email: "no-reply@votronix.com" };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.subject = "Welcome to Votronix!";
    sendSmtpEmail.htmlContent = `<h1>Hello ${username},</h1><p>Welcome to Votronix! Your account has been created successfully.</p>`;

    const apiInstance = new Brevo.TransactionalEmailsApi();
    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.status(201).json({ message: "User created successfully. Confirmation email sent." });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// ✅ Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ email: user.email, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
    res.status(200).json({ token, username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Profile Route
app.get("/profile", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ username: user.username, email: user.email });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// ✅ Upload Image Route (Cloudinary)
app.post("/upload", async (req, res) => {
  try {
    const file = req.body.image; // Base64 Image String
    const result = await cloudinary.uploader.upload(file, { folder: "votronix" });

    res.status(200).json({ message: "Image uploaded successfully", url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: "Upload failed: " + error.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
