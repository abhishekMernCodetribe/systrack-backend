import express from 'express';
import dotenv from "dotenv";
import cors from 'cors';
import cookieParser from "cookie-parser";
import { connectDB } from './utils/db.js';
import Employee from "./employee/employee.route.js";
import Part from "./parts/parts.route.js";
import System from "./system/system.route.js";
import userRoutes from "./user/user.route.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: 'https://systrack-frontend.vercel.app',
    credentials: true,
}));
// app.use(cors({
//     origin: 'http://localhost:5173',
//     credentials: true,
// }));

app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/users', userRoutes);

app.use('/api/employee', Employee);
app.use('/api/part', Part);
app.use('/api/system', System);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    connectDB();
    console.log("server is running on port", PORT);
});
