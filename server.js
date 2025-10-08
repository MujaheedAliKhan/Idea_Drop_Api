//setting up the express and cors
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors()); // This is a middleware in between req and res

app.listen(PORT, () => {
    console.log(`Serving is running on ${PORT}`);
})