const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: Array,    
    required: true
  },
  items: {
    type: Array,
    required: true 
  },

  total: {
    type: Number,
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered','Cancelled','Returned'],
    default: 'Pending'
  },
  orderReturnReson:{
    type:String
  },
  payment:{
    type: String,
    default:'Pending'
  },
  createdAt: {
    type: Date, 
    default: Date.now
     
  },
  deliveryDate:{
    type:Date

  },
  couponId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Coupon'
  },
  couponApplied:{
    type:Boolean
  
  },
  couponDiscount:{
    type:Number
  }
});

module.exports = mongoose.model('Order', orderSchema);