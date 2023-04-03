if (process.env.NODE_ENV !=='production'){
  require('dotenv').config()
}


const express = require('express')
const admin_route = express()
const upload = require('../helpers/multer')
const session = require('express-session')

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')

admin_route.use(session({
  secret: process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false
  
}))

const auth = require("../middelwares/adminAuth")  

const bodyParser = require('body-parser')
admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}))

const adminController = require('../controllers/adminController') 

admin_route.get('/',auth.isLogout,adminController.loadAdminLogin) 
admin_route.post('/',adminController.verifyAdminLogin) 

admin_route.get('/admin_dashboard',auth.isLogin,adminController.loadAdminDashboard)    

admin_route.get('/category_list',auth.isLogin,adminController.loadCategoryList)

admin_route.get('/edit_category',auth.isLogin,adminController.loadEditCategory) 
admin_route.post('/edit_category',adminController.updateCategory)


admin_route.post('/block_category',adminController.blockCategory)

admin_route.get('/add_new_category',auth.isLogin,adminController.loadAddCategory)     
admin_route.post('/add_new_category',adminController.addCategory)

admin_route.get('/user_list',auth.isLogin,adminController.loadUserList) 

admin_route.get('/add_new_user',auth.isLogin,adminController.addNewUser)
admin_route.post('/add_new_user',adminController.insertNewUser) 
 
admin_route.post('/block_user',adminController.blockUser) 

admin_route.get('/product_list',auth.isLogin,adminController.loadProductList) 

admin_route.post('/block_product',adminController.blockProduct)

admin_route.get('/add_product',auth.isLogin,adminController.loadAddNewProduct)
admin_route.post('/add_product',upload.array('image',10),adminController.newProductUpload)   

admin_route.get('/edit_product',auth.isLogin,adminController.loadEditProduct)
admin_route.post('/edit_product',adminController.updateProduct)

admin_route.get('/edit_productImage',auth.isLogin,adminController.loadEditProductImage)
admin_route.post('/edit_productImage',upload.array('image',10),adminController.updateProductImage) 

admin_route.get('/order_list',auth.isLogin,adminController.loadOrderList)  

admin_route.post('/update_order_status',adminController.updateOrderStatus)

admin_route.get('/inventory',auth.isLogin,adminController.loadInventory)

admin_route.get('/add_inventory',auth.isLogin,adminController.loadAddQty)
admin_route.post('/add_inventory',adminController.addProductQty)

admin_route.get('/view_order_details',auth.isLogin,adminController.orderDetails)

admin_route.get('/coupon_list',auth.isLogin,adminController.loadCouponList)

admin_route.get('/add_coupon',adminController.loadAddCoupon)
admin_route.post('/add_coupon',adminController.addCoupon)  

admin_route.post('/deactivate_coupon',adminController.deactivateCoupon) 

admin_route.get('/invoice_download',auth.isLogin,adminController.invoiceDownload) 

admin_route.get('/chart',auth.isLogin,adminController.loadChart) 

admin_route.get('/chart_order_status',auth.isLogin,adminController.loadOrderChart) 

admin_route.get('/sales_report',auth.isLogin,adminController.loadSalesReport)

admin_route.get('/chart_category_sales',auth.isLogin,adminController.loadChartCategorySales)  
 
admin_route.get('/logout',auth.isLogin,adminController.logout)       
 

module.exports = admin_route     