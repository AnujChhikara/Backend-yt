import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export {registerUser}
