import User from '../models/usersModel.js'; // Adjust path

 const protect = async (req, res, next) => {
  try {
    // Check for ID in Body (POST/PATCH) or Query (GET)
    let userId = req.body.userId || req.body.id || req.query.userId;

    // 1. Check if ID exists
    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in. Please provide user ID.",
      });
    }

    // 2. Check if User exists in DB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this ID no longer exists.",
      });
    }

    // 3. SUCCESS: Attach user to the request
    req.user = user; 
    next(); // Move to the next middleware (restrictTo)

  } catch (error) {
    // Handle invalid ID format
    if (error.name === 'CastError') {
         return res.status(400).json({ status: 'fail', message: 'Invalid User ID format' });
    }
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 2. RESTRICT TO: The "VIP List"
// Checks if the user has the right role
 const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // We can access req.user because 'protect' ran first!
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
export { protect, restrictTo };