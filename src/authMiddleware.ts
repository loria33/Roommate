import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "";
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || "";

// JWKS client for token verification
const client = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
});

// Get signing key
const getKey = (header: any, callback: (err: any, key?: string) => void) => {
  client.getSigningKey(header.kid, (err: any, key: any) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

// Verify JWT token
const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: AUTH0_AUDIENCE,
        issuer: `https://${AUTH0_DOMAIN}/`,
        algorithms: ["RS256"],
      },
      (err: any, decoded: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
};

// Extract token from Authorization header
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
};

// Auth middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = await verifyToken(token);

    // Add user info to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Check if user has required permissions
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;

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

// Check if user email domain is allowed
export const requireAllowedDomain = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as any;

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
