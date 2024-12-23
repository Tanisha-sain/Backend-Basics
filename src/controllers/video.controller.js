import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/Cloudinary.js"
import {Video} from "../models/video.models.js"
import mongoose from "mongoose"

// const getAllVideos = asyncHandler(async(req, res) => {
//     const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;

// })

const publishAVideo = asyncHandler(async(req, res) => {
    // get title and description from video
    // get user
    // check if title and description is given
    // take video and thumbnail using multer
    // upload them on cloudinary
    // take duration from cloudinary
    
    const user = req.user;
    const {title, description} = req.body;
    if(!title || !description){
        throw new ApiError(401, "title or description is missing");
    }

    let videoLocalPath = req.files?.video;
    if(videoLocalPath?.length){
        videoLocalPath = videoLocalPath[0]?.path;
    }

    let thumbnailLocalPath = req.files?.thumbnail;
    if(thumbnailLocalPath?.length){
        thumbnailLocalPath = thumbnailLocalPath[0]?.path;
    }

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(401, "Video and Thumbnail required")
    }

    const videoRes = await uploadOnCloudinary(videoLocalPath);
    const thumbnailRes = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoRes || !thumbnailRes){
        throw new ApiError(500, "Error while uploading video or thumbnail");
    }

    const vid = await Video.create({
        videoFile: videoRes?.url,
        thumbnail: thumbnailRes?.url,
        owner: new mongoose.Types.ObjectId(user?._id),
        title,
        description,
        duration: videoRes.duration,
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, vid, "Video published successfully")
    )

})


export {
    publishAVideo,
}