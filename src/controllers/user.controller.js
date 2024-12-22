import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/Cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get User details from frontend
    console.log(req.body);
    const {username, email, fullName, password} = req.body;
    // console.log(`Username: ${username}, email: ${email}, fullName: ${fullName}, password: ${password}`);

    // validate details
    if(
        [username, email, fullName, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are compulsory");
    }

    // check if user already exists
    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })
    // console.log(existedUser);
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images and avatar
    console.log(req.files)
    let avatarLocalPath =  req.files?.avatar;
    if(avatarLocalPath){
        avatarLocalPath = avatarLocalPath[0]?.path;
    }
    let coverImageLocalPath =  req.files?.coverImage;
    if(coverImageLocalPath){
        coverImageLocalPath = coverImageLocalPath[0]?.path;
    }

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
        coverImage: coverImageRes?.url || ""
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    
    // check for user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return response;
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )


    // res.status(200).send({
    //     message: "ok"
    // })
})

const loginUser = asyncHandler( async (req, res) => {
    // get user details 
    console.log(req.body)
    const {username, email, password} = req.body;

    // username or email exists or not
    console.log(`${username}, ${email}, ${password}`)
    if(!username && !email){
        throw new ApiError(400, "Username or Email required")
    }
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!existedUser){
        throw new ApiError(404, "User does not exist")
    }

    // check password
    const isPassCorrect = await existedUser.isPasswordCorrect(password)
    if(!isPassCorrect){
        throw new ApiError(401, "Invalid user credentials");
    }

    // access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existedUser._id);

    const loggedInUser = User.findById(existedUser._id).select("-password -refreshToken")

    // send cookie
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser.username, accessToken, refreshToken
        }, "User logged in successfully")
    )
})

const logoutUser = asyncHandler( async(req, res) => {
    const username = req.user.username;
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {username}, "User logged Out successfully")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
        if(!incomingRefreshToken){
            throw new ApiError(401, "Unauthorized access")
        }
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken._id);
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
        
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                accessToken,
                refreshToken
            }, "Access token refreshed")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export {registerUser, loginUser, logoutUser, refreshAccessToken};