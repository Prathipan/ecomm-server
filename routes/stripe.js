const router = require("express").Router();
const stripe = require("stripe")("sk_test_51McxPOSIjTpouwuTkH40tLux93NSUsEMMHO4JVvMwG2vX8IhTHXBar6RiaIp3KG7UjorIbza4ByEjLgEuyyXWvzu00uziBTA62")

router.post("/payment",async (req,res) => {
    await stripe.paymentIntents.create({
        source : req.body.tokenId,
        amount: req.body.amount,
        currency : "inr"
    },(stripeErr,stripeRes)=>{
        if(stripeErr){
            res.status(500).json(stripeErr)
        }else{
            res.status(200).json(stripeRes)
        }
    })
})

module.exports = router;