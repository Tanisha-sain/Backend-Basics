import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "Content is empty")
    }  
    const owner = await User.findById(req.user?._id);
    if(!owner){
        throw new ApiError(401, "Owner is not found")
    }

    const tweet = await Tweet.create({
        content,
        owner
    })

    if(!tweet){
        throw new ApiError(500, "Tweet not created")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201, tweet, "Tweet created successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    const owner = await User.findById(req.user?._id);

    const deletedTweet = await Tweet.findOneAndDelete(
        {
            _id: tweetId,
            owner
        }
    )
    if(!deletedTweet){
        throw new ApiError(404, "Tweet not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedTweet, "Tweet deleted successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    const {tweetId} = req.params;
    const userId = req.user?._id;

    if(!mongoose.isValidObjectId(tweetId) || !mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Tweet id or user id is invalid")
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: userId
        },
        {
            $set: {
                ...(content && {content: content.trim()})
            }
        },
        {
            new: true
        }
    )

    if(!updatedTweet){
        throw new ApiError(404, "Tweet not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;

    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "fetched user tweets successfully")
    )
})

export {
    createTweet,
    deleteTweet,
    updateTweet,
    getUserTweets
}