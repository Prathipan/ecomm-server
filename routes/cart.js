const Cart = require("../models/CartModel");
const Product = require("../models/ProductModel");
const UserModel = require("../models/UserModel");
const { verifyTokenAndAuth, verifyTokenAndAdmin, verifyToken } = require("./verifyToken");

const router = require("express").Router();

//create Cart
router.post("/add-cart/:id",verifyToken,async(req,res) => {
    const userId = req.params.id;
    const {productId,img,color,size,price,quantity} = req.body;
    try {
      let cart = await Cart.findOne({userId});
      let item = await Product.findOne({_id : productId});
      if(!item){
        res.status(404).send("Item not found")
      }

      if(cart)
      {
        let itemIndex = cart.products.findIndex(p=> p.productId == productId);

        if(itemIndex > -1)
        {
          let productItem = cart.products[itemIndex];
          productItem.quantity += quantity;
          cart.products[itemIndex] = productItem;
        }
        else {
          cart.products.push({productId,img,color,size,quantity,price});
        }
        cart.bill += quantity*price;
        cart = await cart.save();
        return res.status(201).send(cart)
      }
      else{
        // no cart exists, create one
        const newCart = await Cart.create({
            userId,
            products: [{ productId,img, color,size, quantity, price }],
            bill: quantity*price
        });
        return res.status(201).send(newCart);
      }

    } catch (error) {
      console.log(error);
      res.status(500).send("Something went wrong");
    }
    
})

//update Cart
router.put("/:id", verifyTokenAndAuth, async (req, res) => {

  try {
    const updatedCart = await Cart.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedCart);
  } catch (err) {
    res.status(500).json(err);
  }
});

//delete Cart
router.delete("/:userId/:itemId", verifyToken, async (req, res) => {
   const userId = req.params.userId;
    const productId = req.params.itemId;
  try {
       let cart = await Cart.findOne({userId});
        let itemIndex = cart.products.findIndex(p => p.productId == productId);
        if(itemIndex > -1)
        {
            let productItem = cart.products[itemIndex];
            cart.bill -= productItem.quantity*productItem.price;
            cart.products.splice(itemIndex,1);
        }
        cart = await cart.save();
        return res.status(200).send(cart);
  } catch (err) {
    res.status(401).json(err);
  }
});

//get User Cart
router.get("/find/:userId",verifyToken, async (req, res) => {
   const userId = req.params.userId
  try {
    const cart = await Cart.findOne({userId});
    // console.log(user)
    if(cart && cart.products.length>0){
      res.status(200).send(cart)
    }else{
      res.status(401).send("No items found")
    }
  } catch (err) {
    res.status(401).json(err);
  }
});



//get all Cart
router.get("/",verifyTokenAndAdmin, async (req, res) => {
  try{
    const carts = await Cart.find();
    res.status(200).json(carts);
  }catch(err){
    res.status(500).json(err)
  }
});



module.exports = router;
