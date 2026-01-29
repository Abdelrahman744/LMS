import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // Get user ID from request body
    const userId = req.body.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Authentication required. Please provide user ID",
      });
    }

    // Look up user's REAL role from users.json
    const users = JSON.parse(
      fs.readFileSync(`${__dirname}/../dev-data/users.json`)
    );
    const user = users.find((u) => u.id === Number(userId));

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Check if user's role is allowed
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        status: "fail",
        message: `Access denied. ${allowedRoles.join(" or ")} privileges required.`,
      });
    }

    // Attach user to request for use in controllers
    req.user = user;
    next();
  };
};

export { restrictTo };
