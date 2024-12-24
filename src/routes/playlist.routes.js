import {Router} from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    addVideoToPlaylist
} from "../controllers/playlist.controller.js";

const router = Router()
router.use(verifyJwt)

router.route("/").post(createPlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);

export default router;