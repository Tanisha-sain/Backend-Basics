import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
    try {
        if(!filePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        })
        //file uploaded successfully
        // console.log("File uploaded successfully: ", response.url);
        fs.unlinkSync(filePath)
        console.log(response)
        return response;
    } catch (error) {
        fs.unlinkSync(filePath); // remove the locally saved temporary file
        return null;
    }
}

const getPublicId = (url) => {
    const parts = url.split('/');
    const publicIdWithExtension = parts.pop(); 
    const publicId = publicIdWithExtension.split('.')[0]; 
    // console.log(publicId);
    return publicId;
}
// getPublicId("http://res.cloudinary.com/dotmqqmnk/image/upload/v1734948273/cd0ratycrrsqxiwkmwkm.jpg")

const deleteFromCloudinary = async(filePath, type) => {
    try {
        if(!filePath) return null;
        const publicId = getPublicId(filePath);
        // console.log(publicId)
    
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: type,
            invalidate: true
        }, (error, res) => {
                if(error) console.log(error);
                else console.log(res);
        });
    
        return response;
    } catch (error) {
        return null;
    }

}

export {uploadOnCloudinary, deleteFromCloudinary}