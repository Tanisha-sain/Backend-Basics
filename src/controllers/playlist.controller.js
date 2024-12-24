import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { Playlist } from "../models/playlist.models.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";


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

export {
    createPlaylist,
    addVideoToPlaylist,
}