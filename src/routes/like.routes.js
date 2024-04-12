import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    checkIfVideoAlreadyLiked,
    checkIfTweetAlreadyLiked,
    getLikedTweets,
    
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);
router.route("/tweets").get(getLikedTweets);
router.route("/isLiked/v/:Id").get(checkIfVideoAlreadyLiked);
router.route("/isLiked/t/:Id").get(checkIfTweetAlreadyLiked);

export default router