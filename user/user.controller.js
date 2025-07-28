import User from "./user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import dotenv from "dotenv";

dotenv.config();

export const signUp = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password length must be 6" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const JWT_SECRET = process.env.JWT_SECRET;

    const token = await generateToken(user, "1h", JWT_SECRET);

    const tokenExpiry = 60 * 60 * 1000;

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: tokenExpiry,
    });

    return res.status(200).json({
      message: "Login & Signup successful",
      token,
      role: user.role,
      id: user._id,
      name: user.name
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password length must be 6" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const JWT_SECRET = process.env.JWT_SECRET;

    const token = await generateToken(user, "24h", JWT_SECRET);


    const tokenExpiry = 60 * 60 * 1000;

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: tokenExpiry,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      id: user._id,
      name: user.name
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};