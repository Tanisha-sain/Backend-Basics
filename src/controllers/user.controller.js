import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/Cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req, res) => {
    // get User details from frontend
    const {username, email, fullName, password} = req.body;
    console.log(`Username: ${username}, email: ${email}, fullName: ${fullName}, password: ${password}`);

    // validate details
    if(
        [username, email, fullName, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are compulsory");
    }

    // check if user already exists
    const existedUser = User.findOne({
        $or: [{email}, {username}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images and avatar
    const avatarLocalPath =  req.files?.avatar[0]?.path;
    const coverImageLocalPath =  req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    // upload them and cloudinary and check
    const avatarRes = await uploadOnCloudinary(avatarLocalPath);
    const coverImageRes = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatarRes){
        throw new ApiError(400, "Avatar is required");
    }

    // Create user object - create entry in db
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatarRes.url,
        coverImage: coverImageRes.url
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    
    // check for user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return response;
    return res.status(201).jspn(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )


    // res.status(200).send({
    //     message: "ok"
    // })
})


export {registerUser};