const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
mongoose.connect("mongodb://127.0.0.1:27017/ecom_furniture_arnoz")

const express = require('express')
const app = express()
const logger = require('morgan')

port = 3000

app.use(function (req, res, next) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

const path = require('path')
app.use(express.static(path.join(__dirname, 'public')))     

app.set('view engine', 'ejs')

app.use(logger('dev'))
//for user routes
const userRoute = require('./routes/userRoute')  
app.use('/', userRoute)

//for admin routes
const adminRoute = require('./routes/adminRoute')
app.use('/admin', adminRoute)

 app.use((req, res, next) => {
 res.status(404).render('404')
 })


app.listen(port, () => {
  console.log(`Server runs on ${port}`)
})


