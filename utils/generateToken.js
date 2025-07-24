import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const generateToken = async(user, expire='1h', KEY) => {

    const SECRET_KEY = KEY;

    const token = jwt.sign({id: user._id, role: user.role}, SECRET_KEY, {
      expiresIn: expire,
    });
    
    return token;
}