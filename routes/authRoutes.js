import express from "express"
import User from "../models/User.js"
import { jwtVerify } from "jose";
import { JWT_SECRET } from "../utils/getJwtToken.js";
import {generateToken} from '../utils/generateToken.js'
const router = express.Router();


//@route            POST /api/auth/register
//@description      Registering a New User
//@access           Public
router.post('/register', async(req, res, next) => {
    try {
        const {name, email, password} = req.body || {};   
        console.log(req.body);
        if (!name || !email || !password) {
            res.status(400);
            throw new Error ("All Fields are required");     
        }

        // Here checking the email is already registered or not
        const existingUser = await User.findOne({email});

        if (existingUser) {
            res.status(400);
            throw new Error ('User Already Exist');
        }

        //Creating new User
        const user = await User.create({name, email, password});

        //Create Tokens
        const payload = {userId: user._id.toString()};
        const accessToken = await generateToken(payload, '1m');
        const refreshToken = await generateToken(payload, '30d');
        
        //Set refreshToken in Http Only Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production'? 'none' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30d 
        })

        res.status(201).json({
            accessToken,
            user:{
                id: user._id,
                name: user.name,
                email: user.email
            }
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
});

//@route            POST /api/auth/login
//@description      Login a User
//@access           Public

router.post('/login', async (req, res, next) => {
    try {
        const {email, password} = req.body || {};
        if (!email || !password) {
            res.status(400);
            throw new Error('Email and password are required');
        }

        //Find User
        const user = await User.findOne({email});
        if (!user) {
            res.status(401);
            throw new Error ('Invalid Credentials');
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        //the password which is given in the begining of register

        if (!isMatch) {
            res.status(401);
            throw new Error ('Invalid Credentials');
        }

        //Create Token
        const payload = {userId: user._id.toString()};
        const accessToken = await generateToken(payload, '1m');
        const refreshToken = await generateToken(payload, '30d');
        
        //Set refreshToken in Http Only Cookie
         res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production'? 'none' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30d 
        });

        res.status(201).json({
            accessToken,
            user:{
                id: user._id,
                name: user.name,
                email: user.email
            }
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
})

//@route            POST /api/auth/logout
//@description      Logout user and clear refresh token
//@access           Private

router.post('/logout', (req, res) => {
    // with the help of express.js
   res.clearCookie('refreshToken', { // to clearcookie we have to use clearCookie Method
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production'? 'none' : 'lax',
        });
    res.status(200).json({message: 'Logged out Successfully!!'})
});

//@route            POST /api/auth/refresh
//@description      Generate a new access token from refresh token
//@access           Public (Needs valid refresh token in cookie)

router.post("/refresh", async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken; // from cookie-parser
        console.log('Refreshing token...')
        if (!token) {
            res.status(401);
            throw new Error('No refresh Token');
        }

        const {payload} = await jwtVerify(token, JWT_SECRET);

        const user = await User.findById(payload.userId);
        if (!user) {
            res.status(401);
            throw new Error ('No User');
        }

        const newAccessToken = await generateToken({userId: user._id.toString()}, '1m'); // missed this '1m' and tried for 6hours

        res.json({
            accessToken: newAccessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
        });
    } catch (error) {
        res.status(401);
        next(error);
    }
}) 
export default router