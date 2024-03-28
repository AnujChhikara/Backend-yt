import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteOldImageFromCloudinary, deleteVideoFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description} = req.body

    const videoLocalPath = req.files?.video[0]?.path

    let thumbnailLocalPath;

    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path
    }


    //upload video on cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
   

    //checking if files successfully uploaded

    if (!videoFile) {
        throw new ApiError(400, 'Video file is required')
       }
     
       if (!thumbnail) {
        throw new ApiError(400, 'Thumbnail is required')
       }

       //creating new video in database

        const video = await Video.create({
            title,
            description,
            videoFile:videoFile.url,
            duration: videoFile.duration,
            isPublished:true,
            owner:req.user,
            thumbnail:thumbnail.url
        })


    return res.status(200).json({msg:"Video Published Successfully", data:video})
    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Invalid Video request or Video ID")
    }

    res.status(200).json({msg:"Video fetched successfuly", video})
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body

    const thumbnailLocalPath = req.file?.path

    //making sure user atleast updating one thing

    if(!title && !description && !thumbnailLocalPath){
        throw new ApiError(401, "All fields are required")
     }

    //making sure code don't run if user do not want to update thumbnail
    let thumbnail;
    let thumbnailUrl;

    if(thumbnailLocalPath){
     thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
      if(!thumbnail){
        throw new ApiError(402, "thumnail file is required")
     } 
     thumbnailUrl = thumbnail.url

    }

    //finding video by id and updating it 
    
    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
           $set:{
              title, description, thumbnail: thumbnailUrl
           }
        }, 
        {new:true})


        return res.status(200).json({msg:"Video details updated successfully" , data: updatedVideo})

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById({_id:videoId})
    
 
    //deleting files from cloudinary
     await deleteVideoFromCloudinary(video.videoFile)
     await deleteOldImageFromCloudinary(video.thumbnail)

    //deleting video from database
    const response = await Video.deleteOne({_id: videoId})

    return res.status(200).json({data:{response}})
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
