const mongoose = require ('mongoose')

const addressSchema = new mongoose.Schema({
  firstName:{
    type: String,
    required: true
  },
  lastName:{
    type: String,
    required: true
  },
  company:{
    type: String
  },
  phone:{
    type:String
  },
  country:{
    type: String,
    required: true
  },
  addLine1:{
    type: String,
    required: true
  },
  addLine2:{
    type: String,
    required: true
  },
  city:{
    type: String,
    required: true
  },
  district:{
    type: String,
    required: true
  },
  state:{
    type:String,
    required: true
  },
  pincode:{
    type: String,
    required: true
  },
  user:{
    type:mongoose.Schema.Types.ObjectId, 
    ref:"user",
    required:true
}

})

module.exports = mongoose.model('Address', addressSchema )