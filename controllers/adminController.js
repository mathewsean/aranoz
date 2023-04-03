const Admin = require('../models/adminModel')
const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const bcrypt = require('bcrypt')
const { findOne } = require('../models/adminModel')
const { findById, findByIdAndUpdate } = require('../models/userModel')
const { } = require('../models/categoryModel')
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel')
const moment = require('moment')
const PDFDocument = require('pdfkit')
const ExcelJS = require('exceljs')
const fs = require('fs');
const path = require('path');

//To convert bycrpt password
const securePassword = async (password) => {
  try {

    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash

  } catch (error) {

    console.log(error.message);

  }
}

//To open Admin Login Page
const loadAdminLogin = async (req, res) => {
  try {

    res.render('admin_login')

  } catch (error) {

    console.log(error.message);

  }
}

//To Verify Admin Login Credentials
const verifyAdminLogin = async (req, res) => {
  try {

    const adminEmail = req.body.email
    const adminPassword = req.body.password

    const findAdminEmail = await Admin.findOne({ email: adminEmail })

    if (findAdminEmail) {
      const findAdminPassword = await Admin.findOne({ password: adminPassword })
      if (findAdminPassword) {
        req.session.admin_id = findAdminEmail._id
        res.redirect('/admin/admin_dashboard')
      }
      else {
        res.render('admin_login', { message: 'Enter Correct Password' })
      }
    }
    else {

      res.render('admin_login', { message: 'Enter Valid Email' })

    }

  } catch (error) {

    console.log(message.error);

  }
}

//To load admin dashboard after verification
const loadAdminDashboard = async (req, res) => {
  try {


    res.render('adminDashboard');

  } catch (error) {

    console.log(error.message);

  }
}

//To load chart details in admin dashboard

const loadChart = async (req, res) => {
  try {
    const startDate = new Date(new Date().getFullYear(), 0, 1)
    const endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999)

    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $in: ['Shipped', 'Delivered'] }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: { $toDate: "$createdAt" } },
            year: { $year: { $toDate: "$createdAt" } }
          },
          totalSales: { $sum: '$total' },
          totalOrder: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }  
      }
    ]);

    console.log(monthlySales, 'first');
    res.json(monthlySales)
  } catch (error) {
    console.log(error.message);
  }
} 

//To load chart of order status

const loadOrderChart = async (req,res) => {
  try {

    

      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().getFullYear(), 0, 1),
              $lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999)
            },
          },
        },
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ];
      const result = await Order.aggregate(pipeline);
      console.log(result);
      res.json(result)
    
    
  } catch (error) {
    console.log(error.message);
  }
}

//To open catergory wise sales report
const loadChartCategorySales = async (req,res) => {
  try {  

    const { year } = req.params;

    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1),
            $lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999)
          }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: '$product.category',
          sales: {
            $sum: { $multiply: ['$items.quantity', '$product.price'] }
          }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          _id: 0,
          category: '$category.category',
          sales: 1
        }
      }
    ];

    const result = await Order.aggregate(pipeline);

    console.log(result, 'CategoryWiseSales');

    res.status(200).json(result);


  

    
    
  } catch (error) {

    console.log(error.message);
    
  }
}


//To open category list page
const loadCategoryList = async (req, res) => {
  try {

    let search = ''
    if (req.query.search) {
      search = req.query.search
    }

    const categoryData = await Category.find({

      $or: [
        { category: { $regex: '.*' + search + '.*', $options: 'i' } }

      ]

    })

    res.render('listOfCategory', { categories: categoryData })

  } catch (error) {

    console.log(error.message);

  }
}




//Page to Open Edit Category
const loadEditCategory = async (req, res) => {
  try {

    const id = req.query.id
    const categoryData = await Category.findById({ _id: id })

    if (categoryData) {

      res.render('editCategory', { category: categoryData })
    }

  } catch (error) {

    console.log(error.message);

  }
}

//To save edited category
const updateCategory = async (req, res) => {
  try {
    const categoryName = (req.body.categoryname).trim().toUpperCase()
    const id = req.query.id
    const categoryData = await Category.findById({ _id: id })

    if (categoryName == "" || /^\s*$/.test(categoryName)) {
      res.render('editCategory', { message: 'Please enter Category Name', category: categoryData })
    } else {
      const categoryData = await Category.findByIdAndUpdate(
        { _id: req.query.id },
        {
          $set: {
            category: categoryName
          }
        })

      res.redirect('/admin/category_list')
    }

  } catch (error) {
    console.log(error.message);
  }
}

//To load add new category page
const loadAddCategory = async (req, res) => {
  try {

    res.render('addNewCategory')

  } catch (error) {
    console.log(error.message)
  }
}

//To add new category to db
const addCategory = async (req, res) => {
  try {

    const categoryName = (req.body.categoryname).trim().toUpperCase()

    if (categoryName == "" || /^\s*$/.test(categoryName)) {
      res.render('addNewCategory', { message: 'Please enter category Name' })
    }

    else {

      const findCategoryName = await Category.findOne({ category: categoryName })

      if (findCategoryName) {
        res.render('addNewCategory', { message: 'Category Already Exists' })
      }

      else {
        const newCategory = new Category({
          category: categoryName
        })
        await newCategory.save()
        res.redirect('/admin/category_list')
      }
    }

  } catch (error) {

    console.log(error.message);

  }
}

//To load user list in admin dashboard
const loadUserList = async (req, res) => {
  try {
    let search = ''
    if (req.query.search) {
      search = req.query.search
    }

    const userData = await User.find({

      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { email: { $regex: '.*' + search + '.*', $options: 'i' } },
        { mobile: { $regex: '.*' + search + '.*', $options: 'i' } }
      ]
    })

    res.render('listOfUser', { users: userData })

  } catch (error) {

    console.log(error.message);

  }
}

//To add new user from admin dashboard
const addNewUser = async (req, res) => {
  try {

    res.render('addNewUser')

  } catch (error) {
    console.log(error.message);
  }
}

//To add new user from Admin Dashboard
const insertNewUser = async (req, res) => {
  try {

    const name = req.body.name
    const email = req.body.email
    const mobile = req.body.mobile
    const spassword = await securePassword(req.body.password)

    const existingEmail = await User.findOne({ email: email })
    const existingMobile = await User.findOne({ mobile: mobile })

    if (existingEmail || existingMobile) {
      res.render('addNewUser', { message: 'Existing User. Please different credentials' })
    }
    else {
      const user = new User({
        name: name,
        email: email,
        mobile: mobile,
        spassword: spassword,
        is_admin: 0,
        block: false,
        timestamp: Date.now()
      })

      const userData = await user.save()

      if (userData) {
        res.render('addNewUser', { message: 'New User Added Successfully' })
      }
      else {
        res.render('addNewUser', { message: 'Something Wrong. Please Try Again.' })
      }
    }

  } catch (error) {

    console.log(error.message);

  }
}



const loadProductList = async (req, res) => {
  try {

    let search = ''
    if (req.query.search) {
      search = req.query.search
    }


    const isNumber = /^\d+$/.test(search);

    const productData = await Product.find({

      $or: [
        { productName: { $regex: '.*' + search + '.*', $options: 'i' } },
        { description: { $regex: '.*' + search + '.*', $options: 'i' } },

      ]

    }).populate('category')

    res.render('listOfProduct', { products: productData })




  } catch (error) {
    console.log(error.message);
  }
}


// To edit and update the details of user from admin dashboard  

const blockUser = async (req, res) => {
  try {

    const id = req.body.id

    const block = await User.findById(id)
    if (block.block) {

      const userData = await User.findByIdAndUpdate(
        id,
        {
          $set: {
            block: false
          }
        })
      if (userData) {
        res.json('success')
      }
    }
    else {

      const userData = await User.findByIdAndUpdate(
        id,
        {
          $set: {
            block: true
          }
        })
      if (userData) {
        res.json('success')
      }

    }



  } catch (error) {

    console.log(error.message);

  }
}

//To add a new product to database with images
const loadAddNewProduct = async (req, res) => {
  try {

    const categoryData = await Category.find({ block: false })
    res.render('addNewProduct', { categories: categoryData })

  } catch (error) {
    console.log(error.message);
  }
}

//To add a new product
const newProductUpload = async (req, res) => {
  try {

    const images = req.files.map((file) => {
      return file.filename
    })

    if (
      req.body.name != "" &&
      req.body.price != "" &&
      req.body.description != "" &&
      req.body.stock != "" &&
      req.body.category != ""
    ) {
      const productData = new Product({
        productName: req.body.name,
        price: req.body.price,
        description: req.body.description,
        stock: req.body.stock,
        category: req.body.category,
        img1: images,

        active: true
      });
      productData
        .save()
        .then(() => {

          res.redirect("/admin/product_list");
        })
        .catch((err) => {
          console.log(err.message);
        });
    } else {
      const message = "fields don't be blank"
      res.redirect(`admin/addNewProduct?message=${message}`)
    }
  } catch (error) {

    console.log(error.message)
  }
};



//To update block or unblock category
const blockCategory = async (req, res) => {
  try {

    const id = req.body.id

    const block = await Category.findById(id)
    if (block.block) {
      const userData = await Category.findByIdAndUpdate(
        id,
        {
          $set: {
            block: false
          }
        })
      if (userData) {
        res.json('success')
      }
    }
    else {
      const userData = await Category.findByIdAndUpdate(
        id,
        {
          $set: {
            block: true
          }
        })
      if (userData) {
        res.json('success')
      }
    }



  } catch (error) {

    console.log(error.message);

  }
}

//To edit product details

const loadEditProduct = async (req, res) => {
  try {

    const id = req.query.id
    const productData = await Product.findById({ _id: id })
    const categoryData = await Category.find()

    if (productData) {

      res.render('editProduct', { product: productData, categories: categoryData })
    }


  } catch (error) {

    console.log(error.message)

  }
}

//To update the edited product details

const updateProduct = async (req, res) => {
  try {

    const productData = await Product.findByIdAndUpdate(
      { _id: req.query.id },
      {
        $set: {
          productName: req.body.name,
          price: req.body.price,
          description: req.body.description,
          stock: req.body.stock,
          category: req.body.category,

          active: true

        }
      }
    )

    res.redirect('/admin/product_list')

  } catch (error) {

    console.log(error.message)

  }
}

//To edit product Image details

const loadEditProductImage = async (req, res) => {
  try {

    const id = req.query.id
    const productData = await Product.findById({ _id: id })

    if (productData) {

      res.render('editProductImage', { product: productData })
    }


  } catch (error) {

    console.log(error.message)

  }
}

//To update the product image

const updateProductImage = async (req, res) => {
  try {
    const images = req.files.map((file) => {
      return file.filename
    })

    const productData = await Product.findByIdAndUpdate(
      { _id: req.query.id },
      {
        $set: {

          img1: images

        }
      }
    )

    res.redirect('/admin/product_list')

  } catch (error) {

    console.log(error.message)

  }
}


//To block product from product list
const blockProduct = async (req, res) => {
  try {
    const id = req.body.id

    const active = await Product.findById(id)

    if (active.active) {
      const productData = await Product.findByIdAndUpdate(id,
        { $set: { active: false } })
      if (productData) {
        res.json('success')
      }
    }
    else {
      const productData = await Product.findByIdAndUpdate(id,
        { $set: { active: true } })
      if (productData) {
        res.json('success')
      }
    }


  } catch (error) {
    console.log(error.message);
  }


}

//To logout from th admin panel
const logout = async (req, res) => {
  try {

    req.session.admin_id = false
    res.redirect('/admin')

  } catch (error) {
    console.log(error.message);
  }
}

//To open order list page in admin panel
const loadOrderList = async (req, res) => {
  try {

    let order;

    // Check if start and end dates were provided in the request query
    if (req.query.startDate && req.query.endDate) {
      console.log('Filtering is happening');
      const startDate = new Date(req.query.startDate)
      const endDate = new Date(req.query.endDate)

      console.log(startDate);
      console.log(endDate);

      order = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate }
      }).populate('customer');
    } else {
      console.log('No filtering');
      order = await Order.find().populate('customer');

    }

    order = order.map(order => ({
      ...order.toObject(),
      orderDate: moment(order.createdAt).format('DD/MM/YYYY')
    }));

    res.render('listOfOrders', { order });


  } catch (error) {
    console.log(error.message);
  }

}

//To update the order status from order list page
const updateOrderStatus = async (req, res) => {
  try {

    const { orderStatus, orderId } = req.body

    if(orderStatus === 'Delivered'){

      const orderNo = await Order.findByIdAndUpdate(
        orderId,
        { 
          orderStatus: orderStatus, 
          deliveryDate: Date.now() 
        }
      )


    }else{

    const orderNo = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: orderStatus }
    )
    }

  } catch (error) {
    console.log(error.message);
  }
}


//To load iventory page in admin panel
const loadInventory = async (req, res) => {
  try {

    const productData = await Product.find()

    res.render('listOfInventory', { products: productData })

  } catch (error) {
    console.log(error.message);
  }
}

//To open page to add new quantity received for sales
const loadAddQty = async (req, res) => {
  try {

    const id = req.query.id
    const productData = await Product.findById({ _id: id })
    const categoryData = await Category.find()

    if (productData) {

      res.render('updateInventory', { product: productData, categories: categoryData })
    }

  } catch (error) {
    console.log(error.message);
  }
}

//To add new quantity received for sales
const addProductQty = async (req, res) => {
  try {

    const quantity = req.body.stock

    const product = await Product.findByIdAndUpdate(
      req.query.id,
      {
        $inc: { stock: quantity }
      })

    res.redirect('/admin/inventory')

    console.log(product);




  } catch (error) {
    console.log(error.message);
  }
}

//To open order details page from order list admin panel

const orderDetails = async (req, res) => {
  try {

    const orderId = req.query.id

    const order = await Order.findOne({ _id: orderId }).populate('couponId')

    const formattedOrder = {
      ...order.toObject(),
      orderDate: moment(order.createdAt).format('DD/MM/YYYY')
    };

    res.render('orderViewAdmin', { order: formattedOrder })

  } catch (error) {
    console.log(error.message);
  }
}

//To open add coupon page
const loadAddCoupon = async (req, res) => {
  try {

    res.render('addNewCoupon')

  } catch (error) {
    console.log(error.message);
  }
}


const addCoupon = async (req, res) => {
  try {

    const couponName = req.body.couponName.trim().toUpperCase()
    const percentage = req.body.percentage
    const expDate = moment(req.body.expDate).format('L')
    const today = moment().startOf('day')
    console.log(couponName);

    const findExistingCoupon = await Coupon.findOne({ couponName: couponName })

    console.log(findExistingCoupon);

    if (findExistingCoupon) {

      res.render('addNewCoupon', { message: 'Coupon Already Exist.' })

    } else if (percentage < 1 || percentage > 99) {

      res.render('addNewCoupon', { message: 'Enter Value between 1 and 99.' })

    }

    else if (!moment(expDate).isValid() || moment(expDate).isBefore(today)) {

      res.render('addNewCoupon', { message: 'Invalid Date or less than today.' })
    }

    else {

      const newCoupon = new Coupon({

        couponName: couponName,
        percentage: percentage,
        expiryDate: expDate

      })

      await newCoupon.save()

      if (newCoupon) {
        res.redirect('/admin/coupon_list')
      }
      else {
        res.render('addNewCoupon', { message: 'Please Try Again.' })
      }

    }



  } catch (error) {
    console.log(error.message);
  }
}


const loadCouponList = async (req, res) => {
  try {

    let search = ''
    if (req.query.search) {
      search = req.query.search
    }

    const coupon = await Coupon.find({
      $or: [
        { couponName: { $regex: '.*' + search + '.*', $options: 'i' } }

      ]
    })

    res.render('listOfCoupon', { coupon })

  } catch (error) {
    console.log(error.message);
  }
}


const deactivateCoupon = async (req, res) => {
  try {

    const id = req.body.id

    const active = await Coupon.findById(id)

    if (active.active) {
      const couponData = await Coupon.findByIdAndUpdate(id,
        { $set: { active: false } })
      if (couponData) {
        res.json('success')
      }
    }
    else {
      const couponData = await Coupon.findByIdAndUpdate(id,
        { $set: { active: true } })
      if (couponData) {
        res.json('success')
      }
    }



  } catch (error) {
    console.log(error.message);
  }
}

//To download Invoice from Admin Order View

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

//To open Sales Report Page
const loadSalesReport = async (req, res) => {
  try {

    let order;

    
    if (req.query.startDate && req.query.endDate) {
      console.log('Filtering is happening');
      
      const startDate = new Date(req.query.startDate)
      const endDate = new Date(req.query.endDate)

      console.log(startDate);
      console.log(endDate);

      order = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        orderStatus:{$in:['Delivered','Shipped']}

      }).populate('customer');      

      
    } else {
      console.log('No filtering');
      order = await Order.find({orderStatus:{$in:['Delivered','Shipped']}}).populate('customer');
      

    }

    const total = order.reduce((acc, cur) => acc + cur.total, 0);

    console.log(total);

    order = order.map(order => ({
      ...order.toObject(),
      orderDate: moment(order.createdAt).format('DD/MM/YYYY')
    }));

    

    res.render('salesReport', { order, total });
    

  } catch (error) {
    console.log(error.message);     
  }

}









module.exports = {
  loadAdminLogin,
  verifyAdminLogin,
  loadAdminDashboard,
  loadCategoryList,
  loadAddCategory,
  addCategory,
  loadUserList,
  addNewUser,
  insertNewUser,
  blockUser,
  loadAddNewProduct,
  newProductUpload,
  loadProductList,
  loadEditCategory,
  updateCategory,
  blockCategory,
  loadEditProduct,
  updateProduct,
  blockProduct,
  logout,
  loadEditProductImage,
  updateProductImage,
  loadOrderList,
  updateOrderStatus,
  loadInventory,
  loadAddQty,
  addProductQty,
  orderDetails,
  loadAddCoupon,
  addCoupon,
  loadCouponList,
  deactivateCoupon,
  invoiceDownload,
  loadChart,
  loadOrderChart,
  loadSalesReport,
  loadChartCategorySales  

} 