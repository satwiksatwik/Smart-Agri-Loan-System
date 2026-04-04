const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ================= CREATE UPLOAD FOLDER =================
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ================= ALLOWED CONFIG =================

// Allowed mime types
const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf"
];

// Allowed file extensions
const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];

// Strict allowed fields
const validFields = [
    "aadhaar",
    "pan",
    "incomeCertificate",
    "adangal",
    "photo",
    "soilHealthCard"
];

// ================= STORAGE CONFIG =================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {

        // 1️⃣ Validate field name strictly
        if (!validFields.includes(file.fieldname)) {
            return cb(new Error("Invalid upload field."), false);
        }

        // 2️⃣ Validate extension
        const ext = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            return cb(new Error("Invalid file extension."), false);
        }

        // 3️⃣ Unique filename generation
        const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

        const newFileName =
            file.fieldname + "-" + uniqueSuffix + ext;

        cb(null, newFileName);
    }
});

// ================= FILE FILTER =================

const fileFilter = (req, file, cb) => {

    // 1️⃣ MIME type validation
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
            new Error("Invalid file type. Only JPG, PNG, and PDF allowed."),
            false
        );
    }

    // 2️⃣ Special rule: Photo must be image only
    if (file.fieldname === "photo") {
        if (file.mimetype === "application/pdf") {
            return cb(
                new Error("Photo must be an image (JPG or PNG only)."),
                false
            );
        }
    }

    // 3️⃣ Aadhaar, PAN, Income, Adangal can be image OR pdf
    // (no extra restriction needed)

    cb(null, true);
};

// ================= MULTER CONFIG =================

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: fileFilter,
});

// Error handler wrapper for multer
const handleUploadErrors = (req, res, next) => {
    return (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "File too large. Maximum file size is 10MB."
                });
            }
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        }
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    };
};

module.exports = upload;
module.exports.handleUploadErrors = handleUploadErrors;