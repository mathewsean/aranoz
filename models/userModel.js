const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

  name:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true
  },
  mobile:{
    type:String,
    required:true
  },
  otp:{
    type:String,
    required: true
    

  },
  timestamp:{
    type:String,
    required:true
  },
  spassword:{
    type:String,
    required:true
  },
  is_admin:{
    type:Number,
    required:true
  },
  is_verified:{
    type:Number,
    default:0
  },
  block:{
    type:Boolean,
    default:false    
  },
  wallet:{
    type:Number,
    default:0
  }

})

module.exports = mongoose.model('User',userSchema)