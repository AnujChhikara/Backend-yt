import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description){
        return res.status(401).json({msg: "Please fill all the fields"})
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner:req.user._id
    })

    if(!playlist){
        return res.status(402).json({msg:"playlist can not be created right now"})
    }

   return res.status(200).json({msg:"playlist created successfully", data:playlist})
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    let filters ={}
    const {userId} = req.params

    if(userId){
        filters.owner = userId
    }
    
    const userPlaylists = await Playlist.find(filters)
    if(!userPlaylists){
        return res.status(404).json({msg: "Can't find any playlist for this user"})
    }

    return res.status(200).json({msg:"user playlists fetch successfully" , data:userPlaylists})
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        return res.status(404).json({msg: "Error while finding playlist or playlist do not exists"})
    }

    return res.status(200).json({msg:"playlist fetched successfully", data:playlist})
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const video = await Video.findById(videoId)

    if(!video){
        return res.status(404).json({msg:"Can't found video with this videoId"})
    }
    const addVideo = await Playlist.findByIdAndUpdate(playlistId, 
        { $push: { videos: videoId } }, // Use $push to add the videoId to the videos array
        { new: true } // To return the updated playlist after the update
    ) 
    if(!addVideo){
        return res.status(402).json({msg:"Video can not be added to the playlist"})
    }

    return res.status(200).json({msg:"Video added to playlist successfully", data:addVideo})
})

  

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const video = await Video.findById(videoId)

    if(!video){
        return res.status(404).json({msg:"Can't found video with this videoId"})
    }
    const removedVideo = await Playlist.findByIdAndUpdate(playlistId, 
        { $pull: { videos: videoId } }, // Use $push to add the videoId to the videos array
        { new: true } // To return the updated playlist after the update
    ) 
    if(!removedVideo){
        return res.status(402).json({msg:"Video can not be removed to the playlist"})
    }

    return res.status(200).json({msg:"Video removed to playlist successfully", data:removedVideo})

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    const response = await Playlist.findByIdAndDelete(playlistId)
      
    if(!response){
        return res.status(402).json({msg:"failed to find playlst and delete"})
    }

    return res.status(200).json({msg:"playlist deleted successfully", data:response})
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!name && !description){
        return res.status(401).json({msg:"please enter atleast one field to update"})
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $set:{
            name,
            description
        }
    }, {$new:true})

    if(!updatedPlaylist){
        return res.status(400).json({msg:"failed to update playlist"})
    }
    return res.status(200).json({msg:"playlist updated successfully", data:updatedPlaylist})
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
