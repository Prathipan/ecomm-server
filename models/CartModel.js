const mongoose = require("mongoose");
const ObjectID = mongoose.Schema.Types.ObjectId;

const CartSchema = mongoose.Schema(
  {
    userId: { type: ObjectID, required: true,ref: "User" },
    products: [
      {
        productId: {
          type: ObjectID,
          ref : "Product"
        },
        img :{
          type : String
        },
        color : {
          type :String
        },
        size : {
          type : String
        },
        quantity: {
          type: Number,
          default: 1,
        },
        price : {
          type : Number,
          required : true
        }
      },
    ],
    bill : {
      type :Number,
      required: true,
      default : 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", CartSchema);
