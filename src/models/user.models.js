import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from 'bcrypt'


const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique: true,
        lowercase: true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique: true,
        lowercase: true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //cloudinary url
        required:true,
    },
    coverImage:{
        type:String, //cloudinary url
    },
    watchHistory:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Video'
    }], 
    password:{
        type:String,
        required:['true', 'Password is required!']
    },
    refreshToken:{
        type:String
    }


},{timestamps:true})

userSchema.pre("save", async function(next) {

    if(!this.isModified('password')) return next() //checkiing if passowrd is not modified if not then simply return 

// if password is modified then below code will run 
    this.password = await bcrypt.hash(this.password, 10)
    next()

})


userSchema.methods.isPasswordCorrect = async function(passowrd) {
  return await bcrypt.compare(passowrd, this.passowrd)
}

userSchema.methods.generateAccessToken = function() {
    return  jwt.sign(
            {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
         {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
        
        )
}
userSchema.methods.refreshAccessToken = function() {

    return  jwt.sign(
        {
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET, 
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    
    )
}

export const User = mongoose.model('User', userSchema)