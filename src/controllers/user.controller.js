import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

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
      throw new ApiError(404, "user doesn't exist")
   }

   //if user found then verify its password with hashed password 
   //important note: methods which are created by you like generate token etc
   // you have to use {user} that you found from the database not the schema one


   const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
   throw new ApiError(401, "Invalid user credentials")
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
      $set: {
         refreshToken:undefined
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

export {registerUser, loginUser, logOutUser, refreshAccessToken}
