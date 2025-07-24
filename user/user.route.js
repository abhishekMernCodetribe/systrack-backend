import express from "express";
import dotenv from "dotenv";
import {login, signUp} from "./user.controller.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizedRoles } from "../middleware/roleMiddleware.js";

dotenv.config();

const router = express.Router();

router.post("/signup", signUp);

router.post("/login", login);

router.get("/superadmin", verifyToken, authorizedRoles("superadmin"), (req, res) => {
    return res.status(200).json({ message: "Access granted", role: "superadmin" });
});

router.get("/admin", verifyToken, authorizedRoles("admin"), (req, res) => {
    return res.status(200).json({ message: "Access granted", role: "admin" });
});

export default router;
