const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
  couponName:{
    type:String,
    required:true
  },
  percentage:{
    type:Number,
    required:true
  },
  expiryDate:{
    type:String,
    required:true
  },
  active:{
    type:Boolean,
    default:true    
  },
  userId:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
})

module.exports = mongoose.model('Coupon', couponSchema)