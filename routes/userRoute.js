if (process.env.NODE_ENV !=='production'){
  require('dotenv').config()
}

const express = require('express')
const user_route = express()
const session = require('express-session')
const Razorpay = require('razorpay')

user_route.set('view engine','ejs')
user_route.set('views','./views/users')

user_route.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

var instance = new Razorpay({
  key_id: process.env.RAZORPAYID,
  key_secret: process.env.RAZORPAYSECRET,
});

const auth = require('../middelwares/userAuth')

const bodyParser = require('body-parser')
user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({extended:true}))

const userController = require ('../controllers/userController')
const admin_route = require('./adminRoute')

user_route.get('/',userController.loadHome)

user_route.get('/user_login',userController.loadLogin)
user_route.post('/user_login',userController.verifyLogin)


user_route.get('/user_registration',userController.loadRegister)
user_route.post('/user_registration',userController.insertUser)

user_route.get('/verify_otp',userController.loadOTP) 
user_route.post('/verify_otp',userController.verifyOTP) 

user_route.get('/user_home',auth.isLogin,userController.loadUserHome)

user_route.get('/single_product',userController.loadSingleProduct) 


user_route.get('/user_cart',auth.isLogin,userController.loadUserCart) 

user_route.get('/category',userController.loadCategoryProduct) 

user_route.get('/profile',auth.isLogin,userController.loadUserProfile) 

user_route.get('/profile_edit',auth.isLogin,userController.loadUserProfileEdit)
user_route.post('/profile_edit',auth.isLogin,userController.updateUserProfile)

user_route.get('/user_address',auth.isLogin,userController.loadUserAddress) 

user_route.get('/add_address',auth.isLogin,userController.loadAddAddress)
user_route.post('/add_address',userController.addAddress) 

user_route.get('/edit_address',auth.isLogin,userController.loadEditAddress)
user_route.post('/edit_address',userController.updateAddress)
user_route.post('/delete_address',userController.deleteAddress)

user_route.get('/forgot_password',userController.loadForgotPassword)
user_route.post('/forgot_password',userController.sendOtpForgotPassword)

user_route.get('/forgot_password_OTP',userController.loadForgotPasswordOTP)
user_route.post('/forgot_password_OTP',userController.verifyForgotPasswordOTP)

user_route.post('/add_to_cart',auth.isLogin,userController.addToCart)

user_route.get('/cart',auth.isLogin,userController.loadCart)  

user_route.post('/update_cart_quantity',auth.isLogin,userController.addQtyToCart) 

user_route.post('/remove_product_cart',auth.isLogin,userController.removeItemCart) 

user_route.get('/checkout',auth.isLogin,userController.loadCheckout)
user_route.post('/checkout',userController.createOrder) 

user_route.get('/order_confirmation',auth.isLogin,userController.loadOrderConfirmation)

user_route.get('/invoice_download',auth.isLogin,userController.invoiceDownload) 



user_route.post('/create/orderId',(req,res)=>{
  console.log("Create OrderId Request",req.body)
  var options = {
    amount: req.body.amount,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "rcp1"
  };
  instance.orders.create(options, function(err, order) {
    console.log(order);
    res.send({orderId:order.id});//EXTRACT5NG ORDER ID AND SENDING IT TO CHECKOUT
  });
});


user_route.post("/api/payment/verify",(req,res)=>{

  let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;
 
   var crypto = require("crypto");
   var expectedSignature = crypto.createHmac('sha256',process.env.RAZORPAYSECRET)
                                   .update(body.toString())
                                   .digest('hex');
                                   console.log("sig received " ,req.body.response.razorpay_signature);
                                   console.log("sig generated " ,expectedSignature);
   var response = {"signatureIsValid":"false"}
   if(expectedSignature === req.body.response.razorpay_signature)
    response={"signatureIsValid":"true"}
       res.send(response);
       console.log('Payment Processed');
   }); 
    
    


user_route.get('/user_order',auth.isLogin,userController.loadUserOrder)
user_route.post('/cancel_order',userController.cancelOrderUser)
user_route.post('/return_order',userController.returnOrderUser)

user_route.get('/user_order_detail',auth.isLogin,userController.viewOrderDetails) 

user_route.post('/apply_coupon',userController.applyCoupon)

user_route.post('/remove_coupon',userController.removeCoupon)

user_route.get('/user_wallet',auth.isLogin,userController.loadWallet) 

user_route.get('/contact_us',userController.loadContactUs)

user_route.get('/logout',auth.isLogin,userController.logout )   




module.exports = user_route  





 


