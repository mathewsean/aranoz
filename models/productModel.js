const mongoose=require('mongoose')
const Schema=mongoose.Schema

const productSchema=new Schema({
    productName:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    img1:{
        type:Array,
        //required:true
    },
    
    category:{
        type:mongoose.Schema.Types.ObjectId, 
        ref:"Category",
        required:true

    },
    active:{
        type:Boolean
    }

})
module.exports=mongoose.model('Product',productSchema)  