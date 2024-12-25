import {Router} from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos } from "../controllers/like.controller.js";

const router = Router()
router.use(verifyJwt)

router.route("/v/:videoId").post(toggleVideoLike)

router.route("/c/:commentId").post(toggleCommentLike)

router.route("/t/:tweetId").post(toggleTweetLike)

router.route("/videos").get(getLikedVideos)

export default router;