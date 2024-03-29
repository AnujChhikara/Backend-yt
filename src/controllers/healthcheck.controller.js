import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    
    const message = "eVeRyThInG iS fInE wItH tHe ApP";
    return res.status(200).json({msg:message})
})

export {
    healthcheck
    }
    