import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from '../models/user.models.js'
import { deleteOldImageFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


//function fro generating access and refresh token
const generateAccessAndRefreshTokens = async(userId) => {
 try {

   //finding user from database by _id
   const user = await User.findById(userId)

   //generating Token
  const refreshToken = user.generateRefreshToken()
  const accessToken = user.generateAccessToken()

  //saving refreshToken into the database
  user.refreshToken = refreshToken
  await user.save({validateBeforeSave:false})


  return {accessToken, refreshToken}


 } catch (error) {
   throw new ApiError(500, "Something went wrong while generating refresh and access token")
   
 }
}

//registering User

const registerUser = asyncHandler(async (req,res) => {

    //getting user data from req

    const {fullName, email, username, password} = req.body


    //validating if any filed is empty
   if(
        [fullName,email,username,password].some((field)=> 
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }


    //checking if user already exits
  const existedUser = await User.findOne({
     $or:[ {username},  {email}]
   })

   if (existedUser) {
    throw new ApiError(409, "user already exits")
    
   }


   //geting files from multer middleware

   
   const avatarLocalPath = req.files?.avatar[0]?.path
     let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    


 // checking if avatar file is uploaded

   if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is required')
   }
   

 //upload images to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


 //checking if avatar field successfully uploaded

    if (!avatar) {
        throw new ApiError(400, 'Avatar file is required')
       }


 //creating new user in the database

const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    username:username.toLowerCase(),
    password
 })


 //checking if user created successfully
 const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

//this will return user data if user is founded if not then

 if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the user")
 }


 //if user created successfully 

 return res.status(201).json(
    new ApiResponse(200, createdUser,"User Registered Successfully")
 )


  })

  //login user

const loginUser = asyncHandler(async(req,res)=>{
 
   //getting user login data from request body
   
   const {email, username, password} = req.body

   //checking if user not entered email and username both
   if(!email && !username){
      throw new ApiError(400, "username or email is required")
   }
    
   //finding user by email or username whichever available 
   const user =  await User.findOne({
      $or:[{username}, {email}]
   })
    
   //checking if we found user in database
   if(!user){
      return res.status(404).json({msg:"user does not exist!"})
   }

   //if user found then verify its password with hashed password 
   //important note: methods which are created by you like generate token etc
   // you have to use {user} that you found from the database not the schema one


   const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
   return res.status(401).json({msg:"Invalid user credentials!"})
}

   //generating refresh and access Token

  const {accessToken, refreshToken} =await generateAccessAndRefreshTokens(user._id)

 // finding user again so we can get updated one after adding tokens
 //removing passoword and refresh token from it because frontend don't need it
 const loggedInUser = await User.findById(user._id).select(
   "-password -refreshToken"
 )

 //sending cookies 

 const options = {
   httpOnly:true,
   secure:true
 }
 

 return res
 .status(200)
 .cookie("accessToken", accessToken, options)
 .cookie("refreshToken", refreshToken, options)
 .json(
   new ApiResponse(
      200, {
         user:loggedInUser, 
         refreshToken,
         accessToken
      }, "User Logged In Successfully"
   )
 )

})

//logout User

const logOutUser = asyncHandler(async(req,res)=> {
     User.findByIdAndUpdate(req.user._id, {
      $unset: {
         refreshToken:1
      }
     }, {
      new:true
     })

     
 const options = {
   httpOnly:true,
   secure:true
 }
 
   return res
   .status(200)
   .clearCookie("accessToken" , options)
   .clearCookie("refreshToken" , options)
   .json(new ApiResponse(200, {}, "user logout successfully"))
})

//refresh token

const refreshAccessToken = asyncHandler(async(req,res)=>{
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
 
    if(!incomingRefreshToken){
       throw new ApiError(401, "Unauthorized request")
    }
 
    const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
    const user = await User.findById(decodedToken?._id)
 
    if(!user){
       throw new ApiError(401, "Invalid refresh Token")
    }
 
    if(incomingRefreshToken !== user?.refreshToken){
       throw new ApiError(401, "refresh token is expired or used")
    }
         
    const options ={
       httpOnly:true,
       secure:true
    }
 
  const{accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
   return res
   .status(200)
   .coookie("accessToken", accessToken, options)
   .cookie("refreshToken", newRefreshToken, options)
   .json(
    new ApiResponse(200,{
       newRefreshToken,
       accessToken
    }, 
    "Access token refreshed")
   )
  } catch (error) {
   throw new ApiError(401,error?.message || "Invalid refresh token")
  }
})

//updating user details


//changing user password
const changeCurrentUserPassword = asyncHandler(async(req,res)=> {

   const {oldPassword, newPassword} = req.body

   if(!oldPassword && !newPassword){
      throw new ApiError(401, "All fields are required")
   }

   const user = req.user

   const ispassowordCorrect = await user.isPasswordCorrect(oldPassword)

   if(!ispassowordCorrect){
      throw new ApiError(400, "Invalid old Password")
   }
     
   user.password = newPassword
  await user.save({validateBeforeSave:false})
   
   res.status(200).json( new ApiResponse(200, {} , 'Password changed successfully'))
})

//getting current user
const getCurrentUser = asyncHandler(async(req,res)=> {
   return res.status(200).json(new ApiResponse(200,req.user, "current user fetched Successfully"))
})

//updating user details like fullName and email
const updateAccountDetails = asyncHandler(async(req,res)=> {
   const {fullName, email} = req.body

   if(!fullName && !email){
      throw new ApiError(401, "All fields are required")
   }

  const user = await User.findByIdAndUpdate(req.user?._id,
      {
         $set:{
            fullName, email
         }
      }, 
      {new:true}).select("-password")

      return res
      .status(200)
      .json(new ApiResponse(200, user, "Account Details Updated Successfully"))
})

//update user avatar
const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.files?.avatar[0].path
   
   if(!avatarLocalPath){
      throw new ApiError(400, "avatar file is missing")
   }

  const NewAvatar = await uploadOnCloudinary(avatarLocalPath)

  if(!NewAvatar.url){
   throw new ApiError(400, "Error while uploading avatar")

  }

  
  //deleting old avatar image form cloudinary
  await deleteOldImageFromCloudinary(req.user?.coverImage)

 const user = await User.findByIdAndUpdate(req.user?._id,
   {$set: {
      avatar: NewAvatar.url
   }}, {new:true}).select("-password")

   if(!user){
      throw new ApiError(402, "Failed to update user avatar")
   }

   return res.status(200).json(new ApiResponse(200, user, "Avatar image updated successfully"))
})

//update user cover image
const updateUserCoverImg = asyncHandler(async(req,res)=>{
   const coverImgLocalPath = req.files?.coverImage[0].path

   if(!coverImgLocalPath){
      throw new ApiError(400, "coverImage file is missing")
   }

   //uploading cover image on cloudinary
  const coverImg = await uploadOnCloudinary(coverImgLocalPath)

  if(!coverImg.url){
   throw new ApiError(400, "Error while uploading cover image")

  }

  //deleting old coverImage form cloudinary
  await deleteOldImageFromCloudinary(req.user?.coverImage)

  //fetching user from database and then updating new coverImage
 const user = await User.findByIdAndUpdate(req.user?._id,
   {$set: {
      coverImage: coverImg.url
   }}, {new:true}).select("-password")

   

   return res.status(200).json(new ApiResponse(200, user, "cover image updated successfully"))
})

//mongoDB aggregate pipelines **Important

//get user channel profile

const getUserChannelProfile = asyncHandler(async(req, res) => {
   const {username} = req.params

   if (!username?.trim()) {
       throw new ApiError(400, "username is missing")
   }

   const channel = await User.aggregate([
       {
           $match: {
               username: username?.toLowerCase()
           }
       },
       {
           $lookup: {
               from: "subscriptions",
               localField: "_id",
               foreignField: "channel",
               as: "subscribers"
           }
       },
       {
           $lookup: {
               from: "subscriptions",
               localField: "_id",
               foreignField: "subscriber",
               as: "subscribedTo"
           }
       },
       {
           $addFields: {
               subscribersCount: {
                   $size: "$subscribers"
               },
               channelsSubscribedToCount: {
                   $size: "$subscribedTo"
               },
               isSubscribed: {
                   $cond: {
                       if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                       then: true,
                       else: false
                   }
               }
           }
       },
       {
           $project: {
               fullName: 1,
               username: 1,
               subscribersCount: 1,
               channelsSubscribedToCount: 1,
               isSubscribed: 1,
               avatar: 1,
               coverImage: 1,
               email: 1

           }
       }
   ])

   if (!channel?.length) {
       throw new ApiError(404, "channel does not exists")
   }

   return res
   .status(200)
   .json(
       new ApiResponse(200, channel[0], "User channel fetched successfully")
   )
})


//getting user watch history

const getWatchHistory  = asyncHandler(async(req,res) =>{
      const user = await User.aggregate([
         {
            $match:{
               _id:req.user._id
            }
         },{
            $lookup:{
               from:"videos",
               localField: "watchHistory",
               foreignField: "_id",
               as:"watchHistory", 
               pipeline:[
                  {
                     $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                           {
                              $project:{
                                 fullName:1,
                                 username:1,
                                 avatar:1
                              }
                           }
                        ]
                     }
                  },
                  {
                     $addFields:{
                        owner:{
                           $first:"$owner"
                        }
                     }
                  }
               ]
            }
         }
      ])

      return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "user watch history fetch successfully"))
})


export {registerUser,
    loginUser, 
    logOutUser, 
    refreshAccessToken,
    changeCurrentUserPassword, 
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImg,
    getUserChannelProfile,
    getWatchHistory}
