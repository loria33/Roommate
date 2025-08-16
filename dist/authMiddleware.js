"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAllowedDomain = exports.requirePermission = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
// Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "";
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || "";
// JWKS client for token verification
const client = (0, jwks_rsa_1.default)({
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
});
// Get signing key
const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
};
// Verify JWT token
const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, getKey, {
            audience: AUTH0_AUDIENCE,
            issuer: `https://${AUTH0_DOMAIN}/`,
            algorithms: ["RS256"],
        }, (err, decoded) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(decoded);
            }
        });
    });
};
// Extract token from Authorization header
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }
    return null;
};
// Auth middleware
const authenticateToken = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ error: "Access token required" });
        }
        const decoded = await verifyToken(token);
        // Add user info to request
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error("Token verification failed:", error);
        return res.status(403).json({ error: "Invalid token" });
    }
};
exports.authenticateToken = authenticateToken;
// Check if user has required permissions
const requirePermission = (permission) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        // Check for permissions in token
        const permissions = user.permissions || [];
        if (!permissions.includes(permission)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Check if user email domain is allowed
const requireAllowedDomain = (req, res, next) => {
    const user = req.user;
    // If no email in token, allow for now (for testing)
    if (!user || !user.email) {
        console.log("No email in token, allowing access for testing");
        return next();
    }
    const domain = user.email.split("@")[1];
    const allowedDomains = ["verbali.io"];
    if (!allowedDomains.includes(domain)) {
        return res.status(403).json({
            error: "Domain not authorized",
            message: `Email domain @${domain} is not authorized to access this application`,
        });
    }
    next();
};
exports.requireAllowedDomain = requireAllowedDomain;
//# sourceMappingURL=authMiddleware.js.map