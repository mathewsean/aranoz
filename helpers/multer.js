const multer = require('multer')
const path = require('path')

let storage = multer.diskStorage({
  destination:(req,file,cb) => {
    cb(null,'public/images')
  },
  filename:(req,file,cb) => {
    let ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + Date.now() + ext)
  }
})

const upload = multer({storage:storage})

module.exports = multer({storage:storage})  