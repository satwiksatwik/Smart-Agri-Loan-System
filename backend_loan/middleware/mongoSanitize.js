const deepSanitize = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {

            // Remove keys starting with $
            if (key.startsWith("$")) {
                delete obj[key];
                continue;
            }

            if (typeof obj[key] === "object" && obj[key] !== null) {
                deepSanitize(obj[key]);
            }
        }
    }

    return obj;
};

const mongoSanitize = (req, res, next) => {
    if (req.body) deepSanitize(req.body);
    if (req.params) deepSanitize(req.params);

    // ❌ DO NOT TOUCH req.query in Express 5

    next();
};

module.exports = mongoSanitize;
