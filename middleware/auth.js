import {promisify} from 'util';
import jwt from 'jsonwebtoken';
import User from '../models/usersModel.js'; 








 const protect = async (req, res, next) => {
  try {
    let token;
    

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        
        token = req.headers.authorization.split(' ')[1];

      };
  
     
      if(!token) {
        return next(new Error('You are not logged in! Please log in to get access.'));
      }


      // 1. Verify the token
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      

      // 2. Check if the user still exists
      const currentUser = await User.findById(decoded.id);
      if(!currentUser) {
        return next(new Error('The user belonging to this token does no longer exist.'));
      }
      // 3. Grant access to protected route
      req.user = currentUser;   
      next();

  } catch (error) {
    res.status(401).json({
      status: "fail",
      message: "Invalid token or token has expired. Please log in again.",
      error: error.message
    });
  }
};



 const restrictTo = (...allowedRoles) => {
 
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action"
      });
    }
    next();
  };

};

export { protect, restrictTo };