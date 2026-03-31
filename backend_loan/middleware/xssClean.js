const deepClean = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {

            const value = obj[key];

            if (typeof value === "string") {
                obj[key] = value
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
            } else if (typeof value === "object" && value !== null) {
                deepClean(value);
            }
        }
    }

    return obj;
};

const xssClean = (req, res, next) => {
    if (req.body) deepClean(req.body);
    if (req.params) deepClean(req.params);

    // ❌ DO NOT TOUCH req.query in Express 5

    next();
};

module.exports = xssClean;
