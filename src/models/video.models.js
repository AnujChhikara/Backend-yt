import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new mongoose.Schema({
        videoFile:{
            type:String, //from any cdn
            required:true
        },
        thumbnail:{
            type:String, //from any cdn
            required:true
        },
        title:{
            type:String, 
            required:true
        },
        description:{
            type:String, 
            required:true
        },
        duration:{
            type:Number, //from any cdn
            required:true
        },
        view:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId, 
            ref:'User'
        },
        category: {
            type:String,
            required:true
        }


}, {timestamps:true})


videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model('Video', videoSchema)