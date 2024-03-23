import {Router} from 'express'
import { changeCurrentUserPassword,
     getCurrentUser,
      getUserChannelProfile,
       getWatchHistory, 
       logOutUser,
        loginUser,
         refreshAccessToken,
          registerUser,
           updateAccountDetails,
            updateUserAvatar, 
            updateUserCoverImg } from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJwt, verifyJwtForUpdatingUserDetails } from '../middlewares/auth.middleware.js';

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1,

        },{
            name:"coverImage",
            maxCount:1,  
        }
    ]),
     registerUser)


router.route("/login").post(loginUser)

//secured Routes
router.route("/logout").post(verifyJwt, logOutUser)
router.route("/refreshToken").post(refreshAccessToken)
router.route("/changePassword").post(verifyJwtForUpdatingUserDetails, changeCurrentUserPassword)
router.route("/getUser").get(verifyJwt, getCurrentUser)

router.route("/updateAccount").patch(verifyJwt, updateAccountDetails)
router.route("/updateDetails").post(verifyJwt, updateAccountDetails)

router.route("/updateAvatar").patch(verifyJwt,
    upload.fields( [
        {
            name:"avatar",
            maxCount:1,

        }
    ]),updateUserAvatar)
     
router.route("/updateCoverImage").patch(verifyJwt,
        upload.fields( [
            {
                name:"coverImage",
                maxCount:1,
    
            }
        ]),updateUserCoverImg)

router.route("/history").get(verifyJwt, getWatchHistory)
router.route("/c/:username").get(verifyJwt, getUserChannelProfile)

export default router;