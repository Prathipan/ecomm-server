const express = require("express");
const Cart = require("../models/CartModel");
const Order = require("../models/OrdersModel");
const User = require("../models/UserModel");
const stripe = require("stripe")(
  "sk_test_51McxPOSIjTpouwuTkH40tLux93NSUsEMMHO4JVvMwG2vX8IhTHXBar6RiaIp3KG7UjorIbza4ByEjLgEuyyXWvzu00uziBTA62"
);
const {
  verifyTokenAndAuth,
  verifyTokenAndAdmin,
  verifyToken,
} = require("./verifyToken");

const router = require("express").Router();

router.post("/checkout/:id", async (req, res) => {
  try {
    const customer = await stripe.customers.create({
      metadata : {
        user_id : req.body.user._id,
        products : JSON.stringify(req.body.products),
        total : req.body.total
      }
    })
    const line_items = req.body.products.map((item) => {
      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: item.productId,
            images: [item.img],
            metadata: {
              id: item.productId,
            },
          },
          unit_amount: item.price*100,
        },
        quantity: item.quantity,
      };
    });
    const userId = req.params.id;
    let cart = await Cart.findOne({ userId });
    let user = await User.findOne({ _id: userId });
    const email = user.email;
    if (cart) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        shipping_address_collection: { allowed_countries: ["IN"] },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 0, currency: "inr" },
              display_name: "Free Shipping",
              delivery_estimate: {
                minimum: { unit: "hour", value: 2 },
                maximum: { unit: "hour", value: 4 },
              },
            },
          },
        ],
        phone_number_collection: {
          enabled: true,
        },
        line_items,
        customer : customer.id,
        mode: "payment",
        success_url: `https://shopzone-client.netlify.app/orderSuccess`,
        cancel_url: `https://shopzone-client.netlify.app/checkout-failure`,
      });
      if (!session) throw Error("payment failed");
    
      return res.send({ url: session.url });
    } else {
      res.status(500).send("You don't have items in cart");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

let endpointSecret;
// const endpointSecret = "whsec_f87d8189eaed64bc1c313fa9241e0cb507eee619cfb43a04108c3c96d279eb38";

router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let eventType;
  let data;
  
  if(endpointSecret){
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    data = event.data.object;
    eventType = event.type;
  }else{
    data = req.body.data.object;
    eventType = req.body.type;
  }

  if(eventType === "payment_intent.succeeded"){
    stripe.customers.retrieve(data.customer).then( customer =>{
      console.log("Customer details : ",customer);
      console.log("Data :",data)
      createOrder(customer,data,res)
    })
  }

  res.send().end();
});

const createOrder = async(customer,intent,res) => {
  try {
    const orderId = Date.now();
    const data = {
      transactionId : orderId,
      userId : customer.metadata.user_id,
      products : JSON.parse(customer.metadata.products),
      bill : customer.metadata.total,
      address : intent.shipping.address,
    }
    const order = await Order.create(data);
    const updatedCart = await Cart.findOneAndDelete({ userId: customer.metadata.user_id });
    res.status(200).send(order);
  } catch (error) {
    console.log(error)
  }
}

router.put("/:id",verifyTokenAndAdmin,async(req,res) => {
  const orderId = req.params.id;
  try {
    const updatedOrder = await Order.findByIdAndUpdate({_id : orderId},
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedOrder)
  } catch (error) {
    res.status(500).json(error)
  }

})

router.get("/all-orders",verifyTokenAndAdmin,async(req,res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json(error)
  }
})

router.get("/get-orders/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const orders = await Order.find({ userId });
    if (orders) {
      res.status(200).send(orders);
    } else {
      res.status(500).send("no orders found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get income
router.get("/income", verifyTokenAndAdmin, async (req, res) => {
  const date = new Date();
  const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  const prevMonth = new Date(new Date().setMonth(date.getMonth() - 1));

  try {
    const income = await Order.aggregate([
      { $match: { $createdAt: { $gte: prevMonth } } },
      {
        $project: {
          month: { $month: "$createdAt" },
          sales: "$amount",
        },
        $group: {
          _id: "$month",
          total: { $sum: "$sales" },
        },
      },
    ]);
    res.status(200).json(income);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
