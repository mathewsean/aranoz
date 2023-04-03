const mongoose = require ('mongoose')

const cartSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  products:[{
    product:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
    },
    quantity:{
      type: Number,
      required: true,
      default:1
    }
  }],
  couponId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Coupon'
  },
  couponApplied:{
    type:Boolean,
    default:false

  }

})

module.exports = mongoose.model('Cart',cartSchema)