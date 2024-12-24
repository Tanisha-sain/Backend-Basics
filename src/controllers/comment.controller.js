import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import {User} from "../models/user.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId){
        throw new ApiError(401, "video id is missing")
    }
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentOwner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$commentOwner"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                commentOwner: 1
            }
        },
        {
            $skip: (page-1)*limit
        },
        {
            $limit: parseInt(limit)
        }
    ])
    console.log(comments);

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, "Fetched all comments successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body;
    if(!videoId){
        throw new ApiError(401, "video id is missing")
    }
    if(!content){
        throw new ApiError(400, "Empty comment")
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(401, "Unauthorized access")
    }
    // console.log(user)
    const comment = await Comment.create({
        content,
        video,
        owner: user
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201, comment, "Comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {newContent} = req.body;
    if(!commentId){
        throw new ApiError(401, "Comment id is missing")
    }
    if(!newContent){
        throw new ApiError(401, "Empty comment")
    }
    const owner = await User.findById(req.user?._id)
    console.log(owner)
    const comment = await Comment.findOne({
        _id: commentId,
        owner
    });
    if(!comment){
        throw new ApiError(400, "Invalid comment Id or owner");
    }
    if(comment.content == newContent){
        throw new ApiError(400, "No change in comment");
    }

    comment.content = newContent;
    await comment.save({validateBeforeSave: false});

    console.log(comment)
    return res
    .status(200)
    .json(
        new ApiResponse(200, {comment: comment.content}, "Comment updated successfully")
    )
    
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    if(!commentId){
        throw new ApiError(401, "Comment id is missing")
    }
    const owner = await User.findById(req.user?._id)
    console.log(owner)
    const comment = await Comment.findOneAndDelete({
        _id: commentId,
        owner
    });
    if(!comment){
        throw new ApiError(400, "Invalid comment Id or owner");
    }

    console.log(comment)
    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment deleted successfully")
    )

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}