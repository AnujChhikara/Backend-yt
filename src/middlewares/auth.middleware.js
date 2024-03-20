import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.models";

export const verifyJwt = asyncHandler(async(req,_, next) => {
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
    if(!token){
     throw new ApiError(401, "unauthorized Request")
    }
 
   const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
   const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
   if(!user){
     throw new ApiError(401, "Invalid Access Token")
    }
  
    req.user = user
   
   next()
   } catch (error) {
    throw new ApiError(401,error.message || "something went wrong while verifing token")
    
   }

})