import {jwtVerify} from 'jose';// to get payload and user._id
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';
import {JWT_SECRET} from '../utils/getJwtToken.js';

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401);
            throw new Error ('Not Authorized, no token');
        }
        const token = authHeader.split(' ')[1];
        const { payload } = await jwtVerify(token, JWT_SECRET);

        const user = await User.findById(payload.userId).select('_id name email'); 
        // ( select ) method is a mongoose method to select particular thing in the mode
        if (!user) {
           res.status(401);
           throw new Error ('User Not Found'); 
        }

        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        res.status(401);
        next(new Error('Not Authurized, token failed'));
    }

      // Handle expired or invalid token cleanly
    if (error.name === 'JWTExpired') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
