import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/Cloudinary.js"
import {Video} from "../models/video.models.js"
import mongoose from "mongoose"

const getAllVideos = asyncHandler(async(req, res) => {
    const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;

    if(!userId){
        throw new ApiError(401, "Invalid userid")
    }

    const videos = await Video.aggregate([
        {
            $match: {
                $or: [
                    {title: {$regex: query, $options: "i"}},
                    {description: {$regex: query, $options: "i"}}
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "videoOwner"
            }
        },
        {
            $unwind: "$videoOwner"
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                videoOwner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                }
            }
        },
        {
            $sort: {
                [sortBy] : sortType === "asc" ? 1 : -1,
            }
        },
        {
            $skip: (page - 1)*limit
        },
        {
            $limit: parseInt(limit)
        }
    ])
    console.log(videos);
    // console.log(videos[0].videoOwner)

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    )

})

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

const getVideoById = asyncHandler( async (req, res) => {
    const { videoId } = req.params;
    if(!videoId){
        throw new ApiError(401, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})

const deleteVideo = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(401, "Invalid video id");
    }

    const video = await Video.findByIdAndDelete(videoId, {
        projection: {
            owner: 1,
            title: 1,
            thumbnail: 1,
            videoFile: 1
        }
    });

    if(!video){
        throw new ApiError(404, "video not found");
    }

    await deleteFromCloudinary(video.thumbnail, "image")
    await deleteFromCloudinary(video.videoFile, "video")

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video deleted successfully")
    )
})

const updateVideo = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(401, "Invalid video id");
    }

    const {title, description} = req.body;
    const thumbnailLocalPath = req.file?.path;
    if(!title || !description || !thumbnailLocalPath){
        throw new ApiError(401, "Nothing updated")
    }
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                ...(title && {title: title.trim()}),
                ...(description && {description: description.trim()})
            }
        },
        {
            new: true
        }
    )
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    const thumbnailRes = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnailRes){
        throw new ApiError(500, "Error while updating thumbnail")
    }

    const oldThumbnail = video?.thumbnail;
    await deleteFromCloudinary(oldThumbnail, "image");

    video.thumbnail = thumbnailRes?.url;
    await video.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video updated successfully")
    )
})

const togglePublishStatus = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(402, "Video id is missing")
    }
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(401, "Video not found");
    }

    const oldStatus = video.isPublished;
    video.isPublished = !oldStatus;
    await video.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Toggled publish status successfully")
    )
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    deleteVideo,
    updateVideo,
    togglePublishStatus
}