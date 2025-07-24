import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../user/user.model.js";

dotenv.config();

export const verifyToken = async (req, res, next) => {
  const token = req.headers["token"] || req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};