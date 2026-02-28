const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Loan = require("../models/Loan");
const transporter = require("../utils/mailer");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/* =========================================================
   🔐 Generate JWT
========================================================= */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

/* =========================================================
   📩 Send OTP (Register or Login)
========================================================= */
router.post("/send-otp", async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ message: "Email and type required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    let user = await User.findOne({ email });

    /* ================= REGISTER FLOW ================= */
    if (type === "register") {
      if (user && user.username) {
        return res.status(400).json({ message: "User already exists" });
      }

      if (!user) {
        user = new User({ email });
      }

      user.otp = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000;
      user.isVerified = false;

      await user.save();
    }

    /* ================= LOGIN FLOW ================= */
    else if (type === "login") {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.otp = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000;

      await user.save();
    }

    else {
      return res.status(400).json({ message: "Invalid type provided" });
    }

    /* ================= SEND EMAIL ================= */
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Smart Agri Loan - OTP Verification",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* =========================================================
   ✅ Verify OTP (Registration)
========================================================= */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;

    // 🔐 Clear OTP immediately after verification
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.json({ message: "OTP verified successfully" });

  } catch (error) {
    res.status(500).json({ message: "OTP verification failed" });
  }
});

/* =========================================================
   📝 Register User (OTP MUST BE VERIFIED)
========================================================= */
router.post("/register", async (req, res) => {
  try {
    const { username, mobile, email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      return res.status(400).json({
        message: "Please verify your email before registration"
      });
    }

    if (user.username) {
      return res.status(400).json({
        message: "User already registered"
      });
    }

    // ✅ Check duplicate username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        message: "Username already taken"
      });
    }

    // ✅ Check duplicate mobile
    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({
        message: "Mobile number already registered"
      });
    }

    user.username = username;
    user.mobile = mobile;
    user.password = password; // hashed by pre-save middleware
    user.role = "user";

    await user.save();

    res.json({ message: "User Registered Successfully" });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});


/* =========================================================
   🔑 Login (Username + Password)
========================================================= */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      role: user.role,
      username: user.username,
    });

  } catch (error) {
    res.status(500).json({ message: "Login Error" });
  }
});

/* =========================================================
   🔐 Login via Email OTP
========================================================= */
router.post("/login-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 🔐 Clear OTP after successful login
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      role: user.role,
      username: user.username,
    });

  } catch (error) {
    res.status(500).json({ message: "OTP Login Failed" });
  }
});

/* =========================================================
   👤 Get Profile (User + Loan History)
========================================================= */
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -otp -otpExpiry");

    const loans = await Loan.find({ userId: req.user.id });

    res.json({ user, loans });

  } catch (error) {
    res.status(500).json({ message: "Profile Fetch Error" });
  }
});

/* =========================================================
   ✏ Update Profile
========================================================= */
router.put("/profile", protect, async (req, res) => {
  try {
    const { username, mobile } = req.body;

    const user = await User.findById(req.user.id);

    user.username = username || user.username;
    user.mobile = mobile || user.mobile;

    await user.save();

    res.json({ message: "Profile updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Profile update failed" });
  }
});

/* =========================================================
   🔒 Change Password
========================================================= */
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });

  } catch (error) {
    res.status(500).json({ message: "Password change failed" });
  }
});

/* =========================================================
   🖼 Upload Profile Photo
========================================================= */
router.put(
  "/upload-photo",
  protect,
  upload.single("photo"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      user.profilePhoto = req.file.filename; // store filename only
      await user.save();

      res.json({ message: "Profile photo updated successfully" });

    } catch (error) {
      res.status(500).json({ message: "Photo upload failed" });
    }
  }
);

module.exports = router;
