import {Router} from "express"
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJwt)

router
.route("/c/:channelId")
.get(getSubscribedChannels)
.post(toggleSubscription)


router
.route("/u/:channelId")
.get(getUserChannelSubscribers)


export default router;