import express from 'express';
const router = express.Router();
import Idea from '../models/Idea.js';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';

//@route            GET /api/ideas
//@description      GET all ideas
//@access           Public
//@query            _limit (optional limit for the ideas returned)
router.get("/", async (req, res, next) => {
    //sorting the ideas with a backend 
    const limit = parseInt(req.query._limit);
    const query = Idea.find().sort({createdAt: -1});

    if (!isNaN (limit)) {
        query.limit(limit);
    }

    try {
        const ideas = await query.exec(); // it fetchs the all ideas
        res.json(ideas);
        console.log(ideas);
    } catch (error) {
        console.log(error);
        next(error);  
    }
});

//@route            GET /api/idea
//@description      GET single idea
//@access           Public
router.get("/:id", async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {  // it shows the clean error instead of garbage
        res.status(404);
        throw new Error ("Idea Not Found");
    }
    try {
        const idea = await Idea.findById(id); // it fetches the single idea
        if(!idea) {
            res.status(404);
            throw new Error ("Idea Not Found");
        } 
        res.json(idea);
        console.log(idea);
    } catch (error) {
        console.log(error);
        next(error);  
    }
});

//@route            POST /api/ideas
//@description      Create New ideas
//@access           Public
router.post("/", protect, async (req, res, next) => {
    try {
        const {title, summary, description, tags} = req.body || {};
        if (!title?.trim() || !summary?.trim() || !description?.trim()) {
            res.status(404);
            throw new Error ("Title, summary and description are required");
        }

        const newIdea = new Idea ({
            title,
            summary,
            description,
            tags: typeof tags === 'string'
            ? tags 
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : Array.isArray(tags)
            ? tags
            : [],
            user: req.user.id,    
        });
        const savedIdea = await newIdea.save(newIdea);
        res.status(201).json(savedIdea);  
    } catch (error) {
        console.log(error);
        next(error);
    }
});

//@route            DELETE /api/idea
//@description      DELETE idea
//@access           Public
router.delete("/:id", protect, async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {  // it shows the clean error instead of garbage
        res.status(404);
        throw new Error ("Idea Not Found");
    }
    try {
        const idea = await Idea.findById(id);
        if (!idea) {
            res.status(404);
            throw new Error ("Idea Not Found");
        }
        // Check if user owns idea
        if (idea.user.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Not authorized to delete this Idea");
        }

        await idea.deleteOne();
        res.json({message: "Idea Deleted Successfully!"});
        // const idea = await Idea.findByIdAndDelete(id); // it fetches the single idea
        // if(!idea) {
        //     res.status(404);
        //     throw new Error ("Idea Not Found");
        // } 
        
    } catch (error) {
        console.log(error);
        next(error);  
    }
});

//@route            PUT /api/idea
//@description      Update idea
//@access           Public

router.put ("/:id", protect, async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {  // it shows the clean error instead of garbage
            res.status(404);
            throw new Error ("Idea Not Found");
        }

        const idea = await Idea.findById(id);
        if (!idea) {
            res.status(404);
            throw new Error ("Idea Not Found");
        }
        // Check if user owns idea
        if (idea.user.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Not authorized to update this Idea");
        }

        await idea.deleteOne();
        

        const {title, summary, description, tags} = req.body || {};
        if (!title?.trim() || !summary?.trim() || !description?.trim()) {
            res.status(404);
            throw new Error ("Title, summary and description are required");
        }
        
        idea.title = title;
        idea.summary = summary;
        idea.description = description;
        idea.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean) : [];

        const updatedIdea = await idea.save(); // it saves updated idea
        res.json(updatedIdea);
        // const updatedIdea = await Idea.findByIdAndUpdate(id, {
        //     title,
        //     summary,
        //     description,
        //     tags: Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())
        // }, {new:true, runValidators: true});

        //  if(!updatedIdea) {
        //     res.status(404);
        //     throw new Error ("Idea Not Found");
        // } 
        
    } catch (error) {
        console.log(error);
        next(error);
    }
})

export default router;