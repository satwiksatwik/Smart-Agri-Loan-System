const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    // 👤 Username (Added after OTP verification)
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // 📧 Email (Primary Identifier)
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // 📱 Mobile Number
    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // 🔐 Password (Hashed automatically)
    password: {
      type: String,
      minlength: 6,
    },

    // 🛡 Role (User/Admin)
    role: {
      type: String,
      enum: ["user", "admin", "bank_manager"],
      default: "user",
    },

    // 🖼 Profile Photo Path
    profilePhoto: {
      type: String,
      default: "",
    },

    /* ==========================================
       🆕 PERMANENT DOCUMENT STORAGE (NEW)
       ========================================== */
    documents: {
      adangal: {
        type: String,
        default: "",
      },
      incomeCertificate: {
        type: String,
        default: "",
      },
      aadhaar: {
        type: String,
        default: "",
      },
      pan: {
        type: String,
        default: "",
      },
      photo: {
        type: String,
        default: "",
      },
    },

    // 🔢 OTP (For Email Verification / Login)
    otp: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    },

    // ✅ Email Verification Status
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/* ========================================================
   🔐 Hash Password Before Saving
======================================================== */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/* ========================================================
   🔑 Compare Password Method
======================================================== */
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
