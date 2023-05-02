const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true},
    email: { type: String, required: true, unique: true },
    mobile : {type : Number, required:true},
    password: { type: String, required: true },
    confirmPassword : {type: String,required : true},
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
