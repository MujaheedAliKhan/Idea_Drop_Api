//setting up the express and cors
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import ideaRouter from "./routes/ideaRouter.js"
import authRouter from "./routes/authRoutes.js"
import { errorHandler } from './middleware/errorHandler.js'
import connectDB from './config/db.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

//Connect To MongoDB
connectDB();

//cors config
const allowOrigins = [
    'http://localhost:3000'
];

app.use(cors({
    origin: allowOrigins,
    credentials: true // this will allow the headers
})); // This is a middleware in between req and res
//middle to run POST req
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser()); // to refresh cookie

//Routes
app.use('/api/ideas', ideaRouter);
app.use('/api/auth', authRouter);

//404 Fall back
app.use((req, res, next) => {
    const error = new Error (`Not Found ${req.originalUrl}`)
    res.status(404);
    next(error);
})
app.use(errorHandler);


app.listen(PORT, () => {
    console.log(`Serving is running on ${PORT}`);
})