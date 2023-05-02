const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv")
const userRouter = require("./routes/users.js")
const authRouter = require("./routes/auth.js")
const productRouter = require("./routes/product.js")
const cartRouter = require("./routes/cart.js")
const orderRouter = require("./routes/order.js")
const cors = require("cors")
const app = express();
dotenv.config()

mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("DB connected successfully");
}).catch((err) => {
    console.log(err);
})

app.use(cors())
app.use(express.json());
app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/products",productRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)

app.listen(process.env.PORT || 5000, () => {
    console.log("Server is running");
})