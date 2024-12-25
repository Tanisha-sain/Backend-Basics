import {Router} from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    addVideoToPlaylist,
    getUserPlaylists,
    getPlaylistById,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";

const router = Router()
router.use(verifyJwt)

router.route("/").post(createPlaylist)

router.route("/user/:userId").get(getUserPlaylists)

router
.route("/:playlistId")
.get(getPlaylistById)
.delete(deletePlaylist)
.patch(updatePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);

router.route("/remove/:playlistId/:videoId").patch(removeVideoFromPlaylist)

export default router;