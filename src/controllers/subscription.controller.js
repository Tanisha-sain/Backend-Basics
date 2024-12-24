import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.models.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!channelId){
        throw new ApiError(401, "Channel Id is missing");
    }

    const userId = req.user?._id;
    if(!userId){
        throw new ApiError(401, "User id is not available")
    }

    let isSubscribed = false;
    
    let subs = await Subscription.findOneAndDelete(
        {
            channel: channelId, 
            subscriber: userId
        }
    );

    if(!subs){
        const channel = await User.findById(channelId);
        const subscriber = await User.findById(userId);
        if(!channel || !subscriber){
            throw new ApiError(401, "Channel or user not found")
        }
        subs = await Subscription.create({
            channel,
            subscriber
        })
        isSubscribed = true;
    }

    // const channelName = subs.channel.username;
    // const subscriberName = subs.subscriber.username;

    // console.log(channelName);
    // console.log(subscriberName)
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, {isSubscribed}, "Toggled subscription successfully")
    )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // I am the user , i need my subscribers means the document where i am channel 
    // so channelId == Subscription.channel._id
    // the document i will get there subscribers will be mapped to User and i get the info about subscriber
    if(!channelId){
        throw new ApiError(401, "channel id is missing");
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribedUser"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribedUser" },
                subscribedUserNames: {
                    $map: {
                        input: "$subscribedUser",
                        as: "user",
                        in: "$$user.username"
                    }
                }
            }
        },
        {
            $project: {
                channel: 1,
                subscribersCount: 1,
                subscribedUserNames: 1
            }
        }
    ])

    // console.log(subscribers);

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "Fetched user channel subscribers")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if(!channelId){
        throw new ApiError(401, "channel id is missing");
    }
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels"
            }
        },
        {
            $addFields: {
                subscribedCount: { $size: "$subscribedChannels" },
                subscribedChannelNames: {
                    $map: {
                        input: "$subscribedChannels",
                        as: "user",
                        in: "$$user.username"
                    }
                }
            }
        },
        {
            $project: {
                subscriber: 1,
                subscribedCount: 1,
                subscribedChannelNames: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribedChannels, "Fetched subscribed channels")
    )

})
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}