if (process.env.NODE_ENV !=='production'){
  require('dotenv').config()
}


const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const { findOne, collection, findById, findByIdAndUpdate } = require('../models/userModel')
const otpGenerator = require('otp-generator')
const { generate } = require('otp-generator')
const nodemailer = require('nodemailer')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Address = require('../models/userAddressModel')
const { findOneAndUpdate } = require('../models/productModel')
const Cart = require('../models/cartModel')
const { ObjectId } = require('mongodb')
const Order = require('../models/orderModel')
const moment = require('moment')
const Coupon = require('../models/couponModel')
const Swal = require('sweetalert2')
const PDFDocument = require('pdfkit')


//To convert password to secure password
securePassword = async (password) => {
  try {

    const passwordHash = await bcrypt.hash(password, 6)
    return passwordHash

  } catch (error) {

    console.log(error.message);

  }
}

//To open Home Page
const loadHome = async (req, res) => {
  try {

    let search = ''
    if (req.query.search) {
      search = req.query.search
    }


    if (req.session.user) {
      userData = req.session.userData

      const [categoryData, productData, userFind,] = await Promise.all([
        Category.find({ block: false }),
        Product.find({

          active: true,

          $or: [
            { productName: { $regex: '.*' + search + '.*', $options: 'i' } },
            { description: { $regex: '.*' + search + '.*', $options: 'i' } }

          ]

        }),
        User.findOne({ _id: userData._id })
      ])

      // const categoryData = await Category.find({block:false})
      // const productData = await Product.find({active:true}) 
      // const userFind = await User.findOne({_id:userData._id})

      res.render('home', { userData: userFind, products: productData, categories: categoryData })

    }
    else {

      const [categoryData, productData] = await Promise.all([
        Category.find({ block: false }),
        Product.find({
          active: true,

          $or: [
            { productName: { $regex: '.*' + search + '.*', $options: 'i' } },
            { description: { $regex: '.*' + search + '.*', $options: 'i' } }

          ]

        })
      ])
      // const categoryData = await Category.find({block:false})
      // const productData = await Product.find({active:true}) 
      res.render('home', { products: productData, categories: categoryData })



    }



  } catch (error) {
    console.log(error.message);
  }
}

//To open Login page
const loadLogin = async (req, res) => {
  try {

    const categories = await Category.find({ block: false })

    res.render('user_login', { categories })

  } catch (error) {
    console.log(error.message);
  }
}


//To open Register Page
const loadRegister = async (req, res) => {
  try {

    const categories = await Category.find({ block: false })
    res.render('registration', { categories })

  } catch (error) {
    console.log(error.message)

  }
}

//To save details of user till verififcation
const registredUser = {}

//To save user to database
const insertUser = async (req, res) => {
  try {

    const spassword = await securePassword(req.body.password)
    const { name, email, mobile } = req.body
    const existingEmail = await User.findOne({ email: email })
    const existingMobile = await User.findOne({ mobile: mobile })
    const categories = await Category.find({ block: false })

    if (existingEmail || existingMobile) { res.render('registration', { message: 'Existing User', categories }) }

    else {
      const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })

      registredUser[mobile] = {
        name,
        email,
        mobile,
        spassword,
        otp,
        is_admin: 0,
        block: false,
        timestamp: Date.now()
      }

      console.log(otp)

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.EMAILTOSEND,
          pass: process.env.EMAILPASSWORD
        }
      })

      const mailOptions = {
        from: process.env.EMAILTOSEND,
        to: registredUser[mobile].email,
        subject: 'Your One Time Password',
        text: `Your OTP is ${otp}. It will expire within 5 minutes.`
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error)
        }
        else {
          console.log('Email sent: ' + info.response);
        }
      }
      )


      res.redirect('/verify_otp')
    }

  } catch (error) {
    console.log(error.message);
  }


}

//To open page to verify OTP send to email 
const loadOTP = async (req, res) => {
  try {

    const categories = await Category.find({ block: false })

    res.render('otp', { categories })

  } catch (error) {
    console.log(error.message)

  }
}

//To verify OTP with User mobile number
const verifyOTP = async (req, res) => {
  try {

    const categories = await Category.find({ block: false })

    const { mobile, otp } = req.body
    if (!registredUser[mobile]) {
      res.render('otp', { message: 'Wrong Mobile Number entered', categories })
    }

    const { name, email, spassword, timestamp } = registredUser[mobile]

    if (otp === registredUser[mobile].otp && (Date.now() - timestamp < 5 * 60 * 1000)) {



      collection.insertOne(registredUser[mobile], (err, res) => {
        if (err) throw err

      })


      res.render('otp', { message: 'Registration Successful. Please proceed to Sign In', categories })
    }
    else {
      res.render('otp', { message: 'Registration Failed. Please Check Mobile Number and OTP Again.', categories })
    }

  } catch (error) {

    console.log(error.message);

  }

}

//To verify Login of User after Registration
const verifyLogin = async (req, res) => {
  try {

    const categories = await Category.find({ block: false })
    const email = req.body.email
    const password = req.body.password
    const findUser = await User.findOne({ email: email })

    console.log(categories);

    if (findUser) {
      if (findUser.block) {

        res.render('user_login', { message: 'Please contact customer care', categories })

      } else {
        const passwordMatch = await bcrypt.compare(password, findUser.spassword)
        if (passwordMatch) {
          req.session.userData = findUser
          req.session.user = true
          res.redirect('/')
        }

        else {
          res.render('user_login', { message: 'Password Incorrect', categories })
        }

      }
    }
    else {
      res.render('user_login', { message: 'Email is not registred. Please Register.', categories })
    }

  }
  catch (error) {

    console.log(error.message);

  }


}


//To open home page after login
const loadUserHome = async (req, res) => {

  try {
    const productData = Product.find(

    )
    res.render('home', { products: productData })

  } catch (error) {
    console.log(error.message);

  }
}

//To open single product details page
const loadSingleProduct = async (req, res) => {
  try {

    const id = req.query.id
    const productData = await Product.findById(id).populate('category')
    const categories = await Category.find({ block: false })
    const userData = await User.findOne({_id:req.session.userData._id})
    res.render('single_product', { products: productData, categories, userData })

  } catch (error) {
    console.log(error.message);
  }
}

//To open usercart page
const loadUserCart = async (req, res) => {
  try {

    const categories = await Category.find({ block: false })
    const userData = await User.findOne({_id:req.session.userData._id})

    res.render('user_cart', { categories, userData })

  } catch (error) {

    console.log(error.message)

  }
}

const logout = async (req, res, next) => {
  try {

    if (req.session.user) {
      req.session.user = false;
      //req.session.destroy();
      userData = undefined;
      res.redirect("/");

    }
    else {
      next();

    }

  } catch (error) {
    console.log(error.message);
  }
}

//To open category section from home
const loadCategoryProduct = async (req, res) => {
  try {

    const categoryId = req.query.id

    const productData = await Product.find({ category: categoryId })
    const categoryData = await Category.findOne({ _id: categoryId })
    const categories = await Category.find()

    if(req.session.userData){

    const userData = await User.findOne({_id:req.session.userData._id})
    res.render('categoryProductFilter', { products: productData, categoryData, categories,userData})

    }else{

    res.render('categoryProductFilter', { products: productData, categoryData, categories})

    }

  } catch (error) {
    console.log(error.message);  
  }
}

//To open user profile from home page

const loadUserProfile = async (req, res) => {
  try {

    const userId = req.query.id
    const userData = await User.findOne({ _id: userId })
    const categories = await Category.find()



    res.render('userProfile', { userData, categories })

  } catch (error) {
    console.log(error.message);
  }
}

//To open user profile Edit page

const loadUserProfileEdit = async (req, res) => {
  try {

    const userId = req.session.userData._id

    const userData = await User.findOne({ _id: userId })

    const categories = await Category.find()

    res.render('userProfileEdit', { userData, categories })

  } catch (error) {
    console.log(error.message);
  }
}

//To edit and update profile
const updateUserProfile = async (req, res) => {
  try {

    const categories = await Category.find()

    const userDataUpdate = await User.findByIdAndUpdate(
      { _id: req.session.userData._id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile
        }
      }
    )

    if (userDataUpdate) {
      res.redirect('/')
    }
    else {
      res.render('userProfileEdit', { message: 'Please Try Again.',categories })
    }



  } catch (error) {
    console.log(error.message)
  }
}

//To open user page
const loadUserAddress = async (req, res) => {
  try {

    const id = req.session.userData._id

    const userAddress = await Address.find({ user: id })
    const categories = await Category.find()
    const userData = await User.findOne({_id:req.session.userData._id})

    res.render('address', { address: userAddress, categories, userData })

  } catch (error) {
    console.log(error.message);
  }
}


//To open add address page to add new address
const loadAddAddress = async (req, res) => {
  try {

    const categories = await Category.find()
    const userData = await User.findOne({_id:req.session.userData._id})

    res.render('addAddress', { categories, userData })

  } catch (error) {
    console.log(error.message);
  }
}

//To post address details to data base
const addAddress = async (req, res) => {
  try {

    const categories = await Category.find()

    if (
      req.body.firstName != "" &&
      req.body.lastName != "" &&
      req.body.country != "" &&
      req.body.addLine1 != "" &&
      req.body.addLine2 != "" &&
      req.body.city != "" &&
      req.body.district != "" &&
      req.body.state != "" &&
      req.body.pincode

    ) {

      const newAddress = new Address({

        firstName: req.body.firstName,
        lastName: req.body.lastName,
        company: req.body.company,
        phone: req.body.phone,
        country: req.body.country,
        addLine1: req.body.addLine1,
        addLine2: req.body.addLine2,
        city: req.body.city,
        district: req.body.district,
        state: req.body.state,
        pincode: req.body.pincode,
        user: req.query.id

      })
      const saveAddress = await newAddress.save()

      if (saveAddress) {

        res.redirect('/user_address')

      } else {

        res.render('addAddress', { message: 'Please try again', categories })

      }


    } else {
      res.render('addAddress', { message: 'Please enter the details.', categories })
    }

  } catch (error) {

    console.log(error.message);

  }
}

//To open edit page of address

const loadEditAddress = async (req, res) => {
  try {

    const id = req.query.id

    const userAddress = await Address.findById(id)
    const categories = await Category.find()
    const userData = await User.findOne({_id:req.session.userData._id})

    res.render('editAddress', { address: userAddress, categories, userData })



  } catch (error) {
    console.log(error.message);
  }
}

//To delete address

const deleteAddress = async (req, res) => {
  try {

    const addressId = req.body.addressId
    const deleteAddress = await Address.findByIdAndDelete(addressId)

    if (deleteAddress) {
      res.json('success')
    }

  } catch (error) {
    console.log(error.message);
  }
}

//To save edited address

const updateAddress = async (req, res) => {
  try {

    const updateAddress = await Address.findByIdAndUpdate(
      { _id: req.query.id },
      {
        $set: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          company: req.body.company,
          phone: req.body.phone,
          country: req.body.country,
          addLine1: req.body.addLine1,
          addLine2: req.body.addLine2,
          city: req.body.city,
          district: req.body.district,
          state: req.body.state,
          pincode: req.body.pincode

        }
      }
    )

    if (updateAddress) {

      const addressData = await Address.findById(req.query.id)

      res.redirect('/user_address')

    }

  } catch (error) {
    console.log(error.message);
  }
}


//To open forgot password page

const loadForgotPassword = async (req, res) => {
  try {

    const categories = await Category.find()
    
    res.render('forgotPassword', { categories})

  } catch (error) {
    console.log(error.message);
  }
}



let forgotPasswordOtp = {}
//To send otp for forgot password

const sendOtpForgotPassword = async (req, res) => {
  try {

    const email = req.body.email
    const findEmail = await User.findOne({ email: email })
    const categories = await Category.find()



    if (findEmail) {

      const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })

      forgotPasswordOtp = {
        email: email,
        otp: otp,
        timestamp: Date.now()
      }

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.EMAILTOSEND,
          pass: process.env.EMAILPASSWORD
        }
      })

      const mailOptions = {
        from: process.env.EMAILTOSEND,
        to: email,
        subject: 'Your One Time Password',
        text: `Your OTP to reset password is ${otp}. It will expire within 5 minutes.`
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error)
        }
        else {
          console.log('Email sent: ' + info.response);
        }
      })

      res.redirect('/forgot_password_OTP')

    } else {
      
      
      res.render('forgotPassword', { message: 'Not a Registred Email',categories })
    }



  } catch (error) {
    console.log(error.message);
  }

}

//To open page for forgot password

const loadForgotPasswordOTP = async (req, res) => {
  try {

    const categories = await Category.find()

    res.render('verifyOTPforgotPassword', { categories })

  } catch (error) {
    console.log(error.message);
  }
}


//To verify OTP for forgot password
const verifyForgotPasswordOTP = async (req, res) => {
  try {


    const otp = req.body.otp
    const upassword = await securePassword(req.body.password)
    const categories = await Category.find()



    if (otp === forgotPasswordOtp.otp && (Date.now() - forgotPasswordOtp.timestamp < 5 * 60 * 1000)) {

      const updateOTP = await User.updateOne({ email: forgotPasswordOtp.email },
        { $set: { spassword: upassword } }
      )

      if (updateOTP) {
        res.render('verifyOTPforgotPassword', { message: 'Password Updated Succesfully', categories })
      }

    }
    else {
      res.render('verifyOTPforgotPassword', { message: 'Please enter a valid OTP', categories })
    }



  } catch (error) {
    console.log(error.message);
  }
}

//To add items to cart existing and new
const addToCart = async (req, res) => {
  try {

    const cart = await Cart.findOne({ userId: req.session.userData._id })
    const product = await Product.findOne({ _id: req.body.productId })

    if (product.stock > 0) {

      if (!cart) {
        const newCart = new Cart({
          userId: req.session.userData._id,
          products: [{
            product: req.body.productId,
            quantity: 1
          }]
        })
        await newCart.save()
        return res.status(200).json(newCart)
      }

      const existingProduct = cart.products.find(product =>
        product.product == req.body.productId)

      if (existingProduct && existingProduct.quantity < product.stock) {
        existingProduct.quantity += 1
        await cart.save()
        return res.status(200).json(cart)
      } else if (product.stock > 1 && !existingProduct) {

        cart.products.push({
          product: req.body.productId,
          quantity: 1
        })

        await cart.save()
        return res.status(200).json(cart)

      }



    }

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server Error' })
  }
}


//To open cart page 
const loadCart = async (req, res) => {
  try {

    const findCart = await Cart.findOne({ userId: req.session.userData._id })
    const categories = await Category.find()
    const userData = await User.findOne({_id:req.session.userData._id})

    if (findCart) {

      const findProducts = await Cart.aggregate([
        { $match: { userId: new ObjectId(req.session.userData._id) } },
        { $unwind: '$products' },
        {
          $project: {
            product: '$products.product',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'items'

          }
        }
      ])

      const productTotal = await Cart.aggregate([
        { $match: { userId: new ObjectId(req.session.userData._id) } },
        { $unwind: '$products' },
        {
          $project: {
            product: '$products.product',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'items'

          }
        },
        {
          $project: {
            total: { $multiply: ['$quantity', { $arrayElemAt: ['$items.price', 0] }] }
          }
        }
      ])

      const total = await Cart.aggregate([
        { $match: { userId: new ObjectId(req.session.userData._id) } },
        { $unwind: '$products' },
        {
          $project: {
            product: '$products.product',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'items'

          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$quantity', { $arrayElemAt: ['$items.price', 0] }] } }
          }
        }
      ])



      res.render('cart', { product: findProducts, productTotal, total, categories, userData })

    }
    else {
      res.render('noCart', { categories, userData })
    }


  } catch (error) {
    console.log(error.message);
  }
}


//To add quantity from the cart using increment and decrement button
const addQtyToCart = async (req, res) => {
  try {

    const cart = await Cart.findOne({ _id: req.body.cartId });
    const product = await Product.findOne({ _id: req.body.productId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingProduct = cart.products.find(
      (p) => p.product.toString() === req.body.productId.toString()
    );

    if (existingProduct) {
      const newQuantity = existingProduct.quantity + req.body.count;
      if (newQuantity > product.stock) {
        return res
          .status(400)
          .json({ message: `Stock limit reached (${product.stock})` });
      }
      existingProduct.quantity = Math.max(Math.min(newQuantity, product.stock), 1);
    } else {
      cart.products.push({ product: product._id, quantity: 1 });
    }

    await cart.save();
    return res.status(200).json(cart);



  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server Error' })
  }
}


//To remove item from the cart 
const removeItemCart = async (req, res) => {
  try {

    const { cartId, productId, index } = req.body;

    const updatedCart = await Cart.updateOne(
      { _id: cartId },
      { $unset: { [`products.${index}`]: null } },
      { new: true }
    );

    await Cart.updateOne(
      { _id: cartId },
      { $pull: { products: null } },
      { new: true }
    );



    res.json('success');

  } catch (error) {
    console.log(error.message);
  }

}


//To open checkout page
const loadCheckout = async (req, res) => {
  try {

    const address = await Address.find({ user: req.session.userData._id })
    const cartId = await Cart.findOne({ userId: req.session.userData._id }).populate('couponId')
    const userData = await User.findOne({ _id: req.session.userData._id })
    const categories = await Category.find()

    if (cartId) {

      if (cartId.couponApplied) {

        const findProducts = await Cart.aggregate([
          { $match: { userId: new ObjectId(req.session.userData._id) } },
          { $unwind: '$products' },
          {
            $project: {
              product: '$products.product',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'items'

            }
          }
        ])



        const productTotal = await Cart.aggregate([
          { $match: { userId: new ObjectId(req.session.userData._id) } },
          { $unwind: '$products' },
          {
            $project: {
              product: '$products.product',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'items'

            }
          },
          {
            $project: {
              total: { $multiply: ['$quantity', { $arrayElemAt: ['$items.price', 0] }] }
            }
          }
        ])

        const totalSub = await Cart.aggregate([
          { $match: { userId: new ObjectId(req.session.userData._id) } },
          { $unwind: '$products' },
          {
            $project: {
              product: '$products.product',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'items'

            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$quantity', { $arrayElemAt: ['$items.price', 0] }] } }
            }
          }
        ])



        const total = (totalSub[0].total - ((totalSub[0].total * cartId.couponId.percentage) / 100))
        const discount = ((totalSub[0].total * cartId.couponId.percentage) / 100)



        res.render('checkout', { address, findProducts, productTotal, total, cartId, totalSub, discount, userData, categories })


      } else {

        const findProducts = await Cart.aggregate([
          { $match: { userId: new ObjectId(req.session.userData._id) } },
          { $unwind: '$products' },
          {
            $project: {
              product: '$products.product',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'items'

            }
          }
        ])



        const productTotal = await Cart.aggregate([
          { $match: { userId: new ObjectId(req.session.userData._id) } },
          { $unwind: '$products' },
          {
            $project: {
              product: '$products.product',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'items'

            }
          },
          {
            $project: {
              total: { $multiply: ['$quantity', { $arrayElemAt: ['$items.price', 0] }] }
            }
          }
        ])

        const total = await Cart.aggregate([
          { $match: { userId: new ObjectId(req.session.userData._id) } },
          { $unwind: '$products' },
          {
            $project: {
              product: '$products.product',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'items'

            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$quantity', { $arrayElemAt: ['$items.price', 0] }] } }
            }
          }
        ])


        res.render('checkout', { address, findProducts, productTotal, total, cartId, userData, categories })
      }
    } else {

      res.render('noCart',{categories,userData})
    }

  } catch (error) {
    console.log(error.message);
  }
}


//To create an order while click proceed to checkout from checkout page
const createOrder = async (req, res) => {

  try {

    const cart = await Cart.findOne({ userId: req.session.userData._id }).populate('couponId')



    if (cart.couponApplied) {

      const findProducts = await Cart.aggregate([
        { $match: { userId: new ObjectId(req.session.userData._id) } },
        { $unwind: '$products' },
        {
          $project: {
            product: '$products.product',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'items'

          }
        }
      ])



      const productTotal = await Cart.aggregate([
        { $match: { userId: new ObjectId(req.session.userData._id) } },
        { $unwind: '$products' },
        {
          $project: {
            product: '$products.product',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'items'

          }
        },
        {
          $project: {
            total: { $multiply: ['$quantity', { $arrayElemAt: ['$items.price', 0] }] }
          }
        }
      ])

      const totalSub = await Cart.aggregate([
        { $match: { userId: new ObjectId(req.session.userData._id) } },
        { $unwind: '$products' },
        {
          $project: {
            product: '$products.product',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'items'

          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$quantity', { $arrayElemAt: ['$items.price', 0] }] } }
          }
        }
      ])



      const total = (totalSub[0].total - ((totalSub[0].total * cart.couponId.percentage) / 100))
      const discount = ((totalSub[0].total * cart.couponId.percentage) / 100)

      console.log(total, 'total');
      console.log(discount, 'discount');




      const newOrder = new Order({

        customer: req.session.userData._id,
        address: req.body.address,
        items: findProducts,
        total: total,
        payment: req.body.payment,

        couponId: cart.couponId,
        couponApplied: true,
        couponDiscount: discount 


      })

      console.log(newOrder);

      const createOrder = await newOrder.save()

      const { payment } = req.body

      if (createOrder) {

        findProducts.forEach(async (product) => {
          const { product: productId, quantity } = product;

          await Product.updateOne(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
        });

        if (createOrder.payment === 'wallet') {
          await User.updateOne(
            { _id: req.session.userData._id },
            { $inc: { wallet: -createOrder.total } }

          )
        }



        const deleteCart = await Cart.findOneAndDelete({ userId: req.session.userData._id })

        if (deleteCart) {
          console.log('Cart Deleted');
        }
        if (payment === 'COD' || payment === 'wallet') {
          res.redirect(`/order_confirmation?id=${createOrder._id}`)

        } else {

          res.status(200).json({ redirectUrl: `/order_confirmation?id=${createOrder._id}` });

        }
      }


    } else {

      const findProducts = await Cart.aggregate([
        { $match: { userId: new ObjectId(req.session.userData._id) } },
        { $unwind: '$products' },
        {
          $project: {
            product: '$products.product',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'items'

          }
        }
      ])

      const total = await Cart.aggregate([
        { $match: { userId: new ObjectId(req.session.userData._id) } },
        { $unwind: '$products' },
        {
          $project: {
            product: '$products.product',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'items'

          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$quantity', { $arrayElemAt: ['$items.price', 0] }] } }
          }
        }
      ])

      const newOrder = new Order({

        customer: req.session.userData._id,
        address: req.body.address,
        items: findProducts,
        total: total && total[0] && total[0].total ? total[0].total : 0, // Add a check for total here
        payment: req.body.payment,
        // createdAt: moment().format('DD/MM/YYYY, HH:MM')

      })

      const createOrder = await newOrder.save()

      const { payment } = req.body

      if (createOrder) {

        findProducts.forEach(async (product) => {
          const { product: productId, quantity } = product;

          await Product.updateOne(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
        });

        console.log(total);


        if (createOrder.payment === 'wallet') {
          await User.updateOne(
            { _id: req.session.userData._id },
            { $inc: { wallet: -createOrder.total } }

          )
        }



        const deleteCart = await Cart.findOneAndDelete({ userId: req.session.userData._id })

        if (deleteCart) {
          console.log('Cart Deleted');
        }
        if (payment === 'COD' || payment === 'wallet') {
          res.redirect(`/order_confirmation?id=${createOrder._id}`)

        } else {

          res.status(200).json({ redirectUrl: `/order_confirmation?id=${createOrder._id}` });

        }
      }

    }

  } catch (error) {
    console.log(error.message);
  }
}



//To open order confirmation message page
const loadOrderConfirmation = async (req, res) => {
  try {

    const categories = await Category.find()
    const userData = await User.findOne({_id:req.session.userData._id})
    res.render('orderConfirmation', { categories, userData })

  } catch (error) {
    console.log(error.message);
  }
}


//To open order list of user
const loadUserOrder = async (req, res) => {
  try {

    const categories = await Category.find()
    const userData = await User.findOne({_id:req.session.userData._id})

    let order

    if (req.query.startDate && req.query.endDate) {

      console.log('Filtering Happening');

      const startDate = new Date(req.query.startDate)
      const endDate = new Date(req.query.endDate)

      console.log(startDate);
      console.log(endDate);

      order = await Order.find({
        customer: req.session.userData._id,
        createdAt: { $gte: startDate, $lte: endDate }
      })


    } else {

      order = await Order.find({ customer: req.session.userData._id })
      console.log('No Filtering');
    }

    order = order.map(order => ({
      ...order.toObject(),
      orderDate: moment(order.createdAt).format('DD/MM/YYYY')
    }));

    res.render('userOrder', { order, categories, moment, userData })

  } catch (error) {
    console.log(error.message);
  }
}


//To cancel order from uder orderlist page
const cancelOrderUser = async (req, res) => {
  try {

    const { orderId } = req.body

    const orderCancel = await Order.findByIdAndUpdate(
      { _id: orderId },
      { orderStatus: "Cancelled" }
    )
    if (orderCancel) {
      res.json('success')

      const { items } = orderCancel;
      items.forEach(async (item) => {
        const { product: productId, quantity } = item;

        await Product.updateOne(
          { _id: productId },
          { $inc: { stock: quantity } }
        );
      });

    }

    if (orderCancel.payment !== 'COD') {
      await User.updateOne(
        { _id: req.session.userData._id },
        { $inc: { wallet: req.body.orderValue } }
      );
    }

  } catch (error) {
    console.log(error.message);
  }
}


//To return order from uder orderlist page
const returnOrderUser = async (req, res) => {
  try {

    const { orderId } = req.body

    const orderReturn = await Order.findByIdAndUpdate(
      { _id: orderId },
      { orderStatus: "Returned", orderReturnReson: req.body.orderCancelReason }
    )
    if (orderReturn) {
      res.json('success')

      const { items } = orderReturn;
      items.forEach(async (item) => {
        const { product: productId, quantity } = item;

        await Product.updateOne(
          { _id: productId },
          { $inc: { stock: quantity } }
        );
      });


      await User.updateOne(
        { _id: req.session.userData._id },
        { $inc: { wallet: req.body.orderValue } } 
      );


    }

  } catch (error) {
    console.log(error.message);
  }
}




//To view order details from user order list page
const viewOrderDetails = async (req, res) => {
  try {

    const orderId = req.query.id

    const categories = await Category.find()
    const order = await Order.findOne({ _id: orderId }).populate('couponId')
    const userData = await User.findOne({_id:req.session.userData._id})

    const formattedOrder = {
      ...order.toObject(),
      orderDate: moment(order.createdAt).format('DD/MM/YYYY')
    };
   

    
    

    res.render('orderView', { order:formattedOrder, categories, userData})

  } catch (error) {
    console.log(error.message);
  }
}


//To apply coupon 

const applyCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ couponName: req.body.couponName })
    //const cart = await Cart.findOne({_id:req.body.cartId})  
    const cartId = await Cart.findOne({ userId: req.session.userData._id }).populate('couponId')
    const today = moment().format('L')

    if (cartId.couponApplied) {
      console.log(`Coupon Already Applied ${cartId.couponId.couponName}`);
      res.json({ message: `Coupon Already Applied ${cartId.couponId.couponName}` })
    } else {

      if (coupon) {

        if (coupon.active && moment(coupon.expiryDate).isAfter(today)) {

          if (coupon.userId.includes(req.session.userData._id)) {

            console.log('User Already Used the Coupon');
            res.json('User Already Used the Coupon')


          } else {


            const updateCouponInCart = await Cart.findByIdAndUpdate(
              { _id: req.body.cartId },
              {
                couponId: coupon._id,
                couponApplied: true

              })

            const updateuserIdInCoupon = await Coupon.updateOne(
              { _id: coupon._id },
              {
                $push: { userId: req.session.userData._id }
              }
            )

            if (updateCouponInCart && updateuserIdInCoupon) {
              res.json('success')
            }
          }


        } else {
          console.log('Coupon expired. Expiry date:', coupon.expiryDate, 'Current moment:', today);
          res.json('Coupon Expired')
        }

      } else {
        console.log('Invalid Coupon');
        res.json('Invalid Coupon')
      }

    }



  } catch (error) {
    console.log(error.message);
    res.json({ message: 'Coupon could not be applied' })
  }
}


//To remove coupon from checkoutpage

const removeCoupon = async (req, res) => {
  try {

    const cart = await Cart.findOne({ userId: req.session.userData._id })

    const removeIdFromCoupon = await Coupon.updateOne(

      { _id: cart.couponId },
      {
        $pull: { userId: req.session.userData._id }
      }

    )

    const updateCouponApplied = await Cart.findByIdAndUpdate(
      { _id: req.body.cartId },
      {
        couponApplied: false,
        $unset: { couponId: cart.couponId }
      }
    )

    if (removeIdFromCoupon, updateCouponApplied) {
      res.json('success')
    }

  } catch (error) {
    console.log(error.message);
  }
}


//To download Invoice from User Order View

const invoiceDownload = async (req, res) => {
  try {
    const orderId = req.query.id;
    const order = await Order.findOne({ _id: orderId })

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Create a new PDF document
    const doc = new PDFDocument({ font: 'Times-Roman' });

    // Set the response headers for downloading the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order._id}.pdf"`);

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add the order details to the PDF document
    doc.fontSize(18).text(`ARNOZ INVOICE`, { align: 'center' })
    doc.moveDown();
    doc.moveDown();
    doc.fontSize(16).text(`Order Summary - Order ID: ${order._id}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Product Name', { width: 200, continued: true });
    doc.fontSize(12).text('Price', { width: 100, align: 'center', continued: true });
    doc.fontSize(12).text('Qty', { width: 50, align: 'right' });
    doc.moveDown();

    let totalPrice = 0;
    order.items.forEach((items, index) => {
      doc.fontSize(12).text(`${index + 1}. ${items.items[0].productName}`, { width: 200, continued: true });
      const totalCost = items.items[0].price * items.quantity;
      doc.fontSize(12).text(`${totalCost}`, { width: 100, align: 'center', continued: true });

      doc.fontSize(12).text(`${items.quantity}`, { width: 50, align: 'right' });
      doc.moveDown();
      totalPrice += totalCost;
    });

    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: ${totalPrice}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(12).text(`Total Amount with discount: ${order.total}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(12).text(`Ordered Date: ${order.createdAt}`);
    doc.moveDown();
    doc.fontSize(12).text(`Payment Method: ${order.payment === 'COD' ? 'Cash on Delivery' : order.payment === 'wallet' ? 'Wallet' : 'Razor Pay'}`);
    doc.moveDown();
    doc.fontSize(12).text(`Shipping Address: ${order.address[0]}`)
    doc.moveDown();
    doc.fontSize(12).text(`Order Status: ${order.orderStatus}`);

    // Add a "Thank you" message at the end of the invoice
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.fontSize(14).text('Thank you for purchasing with us!', { align: 'center' });

    // End the PDF document
    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};


const loadWallet = async (req, res) => {
  try {

    const order = await Order.find({ customer: req.session.userData._id, payment: 'wallet' })
    const categories = await Category.find()
    const userData = await User.findOne({_id:req.session.userData._id})


    res.render('userWallet', { order, categories, userData })

  } catch (error) {
    console.log(error.message);
  }
}

const loadContactUs = async (req, res) => {
  try {

    const categories = await Category.find({ block: false })
    const userData = await User.findOne({_id:req.session.userData._id})

    res.render('contactus', { categories, userData })

  } catch (error) {
    console.log(error.message);
  }
}


module.exports = {
  loadHome,
  loadLogin,
  loadRegister,
  loadOTP,
  verifyOTP,
  insertUser,
  verifyLogin,
  loadUserHome,
  loadSingleProduct,
  loadUserCart,
  loadCategoryProduct,
  logout,
  loadUserProfile,
  loadUserProfileEdit,
  updateUserProfile,
  loadUserAddress,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  updateAddress,
  loadForgotPassword,
  sendOtpForgotPassword,
  loadForgotPasswordOTP,
  verifyForgotPasswordOTP,
  addToCart,
  loadCart,
  addQtyToCart,
  removeItemCart,
  loadCheckout,
  deleteAddress,
  createOrder,
  loadOrderConfirmation,
  loadUserOrder,
  cancelOrderUser,
  viewOrderDetails,
  applyCoupon,
  removeCoupon,
  returnOrderUser,
  invoiceDownload,
  loadWallet,
  loadContactUs

}

