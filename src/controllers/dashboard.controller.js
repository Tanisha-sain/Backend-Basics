import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import mongoose, {isValidObjectId} from "mongoose";
import { User } from "../models/user.models.js";
import {Video} from "../models/video.models.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.


    const userId = req.user?._id;
    // console.log(req.user?._id)
    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(401, "Invalid user id")
    }

    const data = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            } 
        }, 
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "userVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "comments",
                            localField: "_id",
                            foreignField: "video",
                            as: "videoComments"
                        }
                    },
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "videoLikes"
                        }
                    },
                    {
                        $addFields: {
                            videoComments: {
                                $size: "$videoComments"
                            },
                            videoLikes: {
                                $size: "$videoLikes"
                            }
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$userVideos"
                },
                totalSubscribers: {
                    $size: "$subscribers"
                },
                totalViews: {
                    $sum: "$userVideos.views"
                },
                totalComments: {
                    $sum: "$userVideos.videoComments"
                },
                totalVideoLikes: {
                    $sum: "$userVideos.videoLikes"
                }
            }
        },
        {
            $project: {
                totalComments: 1,
                totalSubscribers: 1,
                totalVideos: 1,
                totalViews: 1,
                totalVideoLikes: 1,
                username: 1,
                avatar: 1,
                // subscribers: {
                //     _id: 1
                // },
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, data, "Channel statistics")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }
    const videos = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        }, 
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        // {
        //     $unwind: "$videos"
        // },
        {
            $project: {
                videos: 1
            }
        }
    ])

    if(!videos){
        throw new ApiError(404, "No videos found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    )
})

export { getChannelStats, getChannelVideos }