import {Router} from "express"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import {publishAVideo} from "../controllers/video.controller.js"

const router = Router()
router.use(verifyJwt)

router.route("/").post(
    upload.fields([
        {
            name: "video",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
)

export default router;