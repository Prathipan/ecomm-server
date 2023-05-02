const router = require("express").Router();
const User = require("../models/UserModel");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  const newuser = new User({
    userName: req.body.userName,
    LastName: req.body.LastName,
    email: req.body.email,
    mobile: req.body.mobile,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  if (newuser.password === newuser.confirmPassword) {
    newuser.password = CryptoJS.AES.encrypt(
      req.body.password,
      process.env.SEC_KEY
    ).toString();
    newuser.confirmPassword = newuser.password

    try {
      const savedUser = await newuser.save();
      const { password,confirmPassword, ...others } = savedUser._doc
      res.status(200).json(others);
    } catch (err) {
      res.status(500).json(err);
    }
  }else{
    res.status(500).json({message : "Password mismatch"})
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    !user && res.status(401).json({ message: "User not found!!" });

    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.SEC_KEY
    );
    const OrgPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

    OrgPassword != req.body.password &&
      res.status(401).json({ message: "wrong password!!!!" });

    const accessToken = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      process.env.JWT_SEC,
      { expiresIn: "2d" }
    );

    const { password, ...others } = user._doc;

    res.status(200).json({ ...others, accessToken });
  } catch (err) {
    res.status(501).json(err);
  }
});

module.exports = router;
