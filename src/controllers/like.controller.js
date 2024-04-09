import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user._id

    try {
        
        // Check if the user is already liekd the video
        const alreadyLiked = await Like.findOne({
            video: videoId,
            likedBy:userId
        });

        
        if (alreadyLiked) {
            // If the user is already liked
            await Like.deleteOne({
                video: videoId,
                likedBy:userId
            });
            res.json({ liked: false });
        } else {
            // If the user is not already liked
            await Like.create({
                video: videoId,
                likedBy:userId
            });
            res.status(200).json({liked:true})
        }

    } catch (error) {
        
        res.status(500).json({ msg: "Server Error" });
        
    }   
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user._id

    try {
        
        // Check if the user is already liked the comment
        const alreadyLiked = await Like.findOne({
            comment: commentId,
            likedBy:userId
        });

        
        if (alreadyLiked) {
            // If the user is already liked the comment
            await Like.deleteOne({
                comment: commentId,
                likedBy:userId
            });
            res.json({ liked: false });
        } else {
            // If the user is not already liked the comment
            await Like.create({
                comment: commentId,
                likedBy:userId
            });
            res.status(200).json({liked:true})
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server Error" });
        
    } 

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id

    try {
        
        // Check if the user is already liked the tweet
        const alreadyLiked = await Like.findOne({
            tweet: tweetId,
            likedBy:userId
        });

        
        if (alreadyLiked) {
            // If the user is already liked the tweet
            await Like.deleteOne({
                tweet: tweetId,
                likedBy:userId
            });
            res.json({ liked: false });
        } else {
            // If the user is not already liked the tweet
            await Like.create({
                tweet: tweetId,
                likedBy:userId
            });
            res.status(200).json({liked:true})
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server Error" });
        
    } 
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const likedVideos = await Like.aggregate([
        {$match: {
            likedBy:userId
        }},
        {$lookup:{
            from: "videos",
               localField: "video",
               foreignField: "_id",
               as: "LikedVideo"
        }}
    ])

    const filteredLikedVideos = likedVideos.filter(likedVideo => likedVideo.LikedVideo.length > 0); 
    const likedVideoArray = filteredLikedVideos.map((video)=> video.LikedVideo)

   return res.status(200).json({data: likedVideoArray})
})


const checkIfAlreadyLiked = asyncHandler(async (req,res)=>{

    const {Id} = req.params
    const userId = req.user._id

    

          try {
              // Query to find if the user has liked a tweet
            const tweetLike =await  Like.findOne({ likedBy:userId, tweet: Id})
  
              // Query to find if the user has liked a video
             const videoLike = await Like.findOne({ likedBy:userId, video: Id })
         
             const hasLiked = tweetLike || videoLike;
             if(hasLiked) {
              return res.status(200).json({msg:true})
             }
  
             return res.status(400).json({msg:false})
          } catch (error) {
            
            return res.status(400).json({msg:false})

          }

     
})
export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    checkIfAlreadyLiked
}