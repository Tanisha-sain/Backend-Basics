import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    deleteTweet,
    updateTweet,
    getUserTweets
} from "../controllers/tweet.controller.js"

const router = Router()
router.use(verifyJwt)

router.route("/").post(createTweet)

router.route("/user/:userId").get(getUserTweets)

router
.route("/:tweetId")
.delete(deleteTweet)
.patch(updateTweet)

export default router