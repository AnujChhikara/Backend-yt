import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {tweet} = req.body
    const postTweet = await Tweet.create({
        content: tweet,
        owner: req.user._id
    })

   return res.status(200).json({msg:"tweet posted successfully", data:postTweet})
})


const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params
    let filters = {};

    if (userId) {
        filters.owner = userId;
    }

    try {
        // Fetch videos with pagination, filtering, and sorting
        const tweets = await Tweet.find(filters)
      

        return res.status(200).json({ success: true, data: tweets});
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server error' });
    }
    
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweet} = req.body
    const {tweetId} = req.params

    if(!tweet){
        return res.status(200).json({msg:"Please enter some text"})
    }
  
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
           $set:{
              content:tweet
           }
        }, 
        {new:true})
    return res.status(200).json({msg: "tweet updated successfully", data:updatedTweet})
})

const deleteTweet = asyncHandler(async (req, res) => {

    const {tweetId} = req.params
     
    const response = await Tweet.findByIdAndDelete(tweetId)
    
    return res.status(200).json({msg: "tweet deleted successfully", data:response})

    
    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
