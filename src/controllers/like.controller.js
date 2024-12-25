import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user?._id;
    if(!mongoose.isValidObjectId(videoId) || !mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Invalid video id")
    }

    let isLiked = false;
    let likedVideo = await Like.findOneAndDelete({
        video: videoId,
        likedBy: userId
    });

    if(!likedVideo){
        likedVideo = await Like.create({
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: new mongoose.Types.ObjectId(userId)
        })
        isLiked = true;
    }

    if(!likedVideo){
        throw new ApiError(501, "Internal server error")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {likedVideo, isLiked}, "Toggled video like")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const userId = req.user?._id;
    if(!mongoose.isValidObjectId(commentId) || !mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Invalid comment id")
    }

    let isLiked = false;
    let likedComment = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: userId
    });

    if(!likedComment){
        likedComment = await Like.create({
            comment: new mongoose.Types.ObjectId(commentId),
            likedBy: new mongoose.Types.ObjectId(userId)
        })
        isLiked = true;
    }

    if(!likedComment){
        throw new ApiError(501, "Internal server error")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {likedComment, isLiked}, "Toggled comment like")
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const userId = req.user?._id;
    if(!mongoose.isValidObjectId(tweetId) || !mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    let isLiked = false;
    let likedTweet = await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: userId
    });

    if(!likedTweet){
        likedTweet = await Like.create({
            tweet: new mongoose.Types.ObjectId(tweetId),
            likedBy: new mongoose.Types.ObjectId(userId)
        })
        isLiked = true;
    }

    if(!likedTweet){
        throw new ApiError(501, "Internal server error")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {likedTweet, isLiked}, "Toggled tweet like")
    )

})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "invalid user id")
    }

    const videos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: {
                    $ne: null
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos"
            }
        },
        // {
        //     $unwind: "$likedVideos"
        // },
        {
            $addFields: {
                likedVideos: "$likedVideos"
            }
        },
        {
            $project: {
                likedVideos: 1
            }
        }
    ])

    if(!videos){
        throw new ApiError(404, "Zero liked videos")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Fetched liked videos successfully")
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}