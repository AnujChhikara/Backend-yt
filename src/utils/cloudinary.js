import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
import { ApiError } from './ApiError.js';

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        //upload file on cloudinary

      const response = await  cloudinary.uploader.upload(localFilePath, {
            resource_type:'auto'
        });

        // if file uploaded successfully
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload oper
              return null
    }
}

const deleteOldImageFromCloudinary = async (oldImageUrl) => {
  try {
      if(!oldImageUrl) return null
      const publicId = oldImageUrl.split('/').pop().split('.')[0];
    
      const response = await  cloudinary.uploader.destroy(publicId, function(result) { console.log(result) });
      return response
    }
    catch (error){
     throw new ApiError(401,"failed to delete old image from cloudinary")

    }

   

  }


export { uploadOnCloudinary, deleteOldImageFromCloudinary};
