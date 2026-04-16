const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { handleMessage } = require("../controllers/chatbotController");

// Optional auth — chatbot works for both logged-in and anonymous users
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch (err) {
    // Not authenticated — that's fine, chatbot still works
  }
  next();
};

router.post("/message", optionalAuth, handleMessage);

module.exports = router;
