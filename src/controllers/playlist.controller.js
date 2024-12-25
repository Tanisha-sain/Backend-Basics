import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { Playlist } from "../models/playlist.models.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import mongoose, {isValidObjectId} from "mongoose";


const createPlaylist = asyncHandler( async (req, res) => {
    const {name, description} = req.body;
    if(!name){
        throw new ApiError(401, "Name of playlist is required");
    }
    let playlist = await Playlist.findOne({name})
    if(playlist){
        throw new ApiError(409, "Playlist with same name exists")
    }
    const owner = await User.findById(req.user?._id)
    playlist = await Playlist.create({
        name,
        description,
        owner
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    )
    
})

const addVideoToPlaylist = asyncHandler( async (req, res) => {
    const {videoId, playlistId} = req.params;
    if(!videoId || !playlistId){
        throw new ApiError(401, "Video Id or playlist id is missing")
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    const user = await User.findById(req.user?._id)
    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: user
        },
        {
            $addToSet: {
                videos : video
            }
        },
        {
            new: true
        }
    )
    // const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not exists")
    }
    console.log(playlist)
    return res
    .status(202)
    .json(
        new ApiResponse(202, playlist, "Video added to playlist")
    )
})

const getUserPlaylists = asyncHandler( async (req, res) => {
    const {userId} = req.params;
    if(!userId){
        throw new ApiError(401,"User id is missing");
    }
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $addFields: {
                videoCount: {
                    $size: "$videos"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                owner: 1,
                videoCount: 1
            }
        }
    ])

    // console.log(playlists)

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    if(!playlistId){
        throw new ApiError(401,"Playlist id is missing");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {videoId, playlistId} = req.params;

    if(!videoId || !playlistId){
        throw new ApiError(401, "Video Id or playlist id is missing")
    }

    if(!mongoose.isValidObjectId(videoId) || !mongoose.isValidObjectId(playlistId)){
        throw new ApiError(403, "Video id or playlist id is invalid")
    }

    const owner = await User.findById(req.user?._id)

    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner
        },
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new : true
        }
    )

    // console.log(playlist)

    if(!playlist){
        throw new ApiError(403, "Playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Removed video successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const user = await User.findById(req.user._id);
    if(!user){
        throw new ApiError(403, "User not found")
    }
    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError("Playlist id is invalid")
    }

    const deletedPlaylist = await Playlist.findOneAndDelete(
        {
            _id: playlistId,
            owner: user
        }
    )

    if(!deletedPlaylist){
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedPlaylist, "Playlist deleted Successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const {name, description} = req.body;

    // if(!title && !description){
    //     throw new ApiError(401, "No updation")
    // }
    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(403, "Playlist id is invalid")
    }
    const owner = await User.findById(req.user?._id)
    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner
        },
        {
            $set: {
                ...(name && {name : name.trim()}),
                ...(description && {description: description.trim()})
            }
        },
        {
            new : true
        }
    )

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    console.log(playlist)

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    addVideoToPlaylist,
    getUserPlaylists,
    getPlaylistById,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}