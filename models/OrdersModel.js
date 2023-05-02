const mongoose = require("mongoose");

const OrderSchema = mongoose.Schema(
  {
    userId: { type: String, required: true },
    products: [
      {
        productId: {
          type: String,
        },
        color : { type :String },
        size  : { type : String },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    bill : {type : Number , required : true},
    address : { type : Object , required : true},
    transactionId : {type : String,required : true},
    status : {type : String , default : "pending"}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
