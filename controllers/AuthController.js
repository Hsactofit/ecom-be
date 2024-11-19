const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const api_config = require("../config/api");

const AuthController = {
  async create_user(req, res) {
    const { fullname, email, password, phone, role } = req.body;

    // console.log(req.body);

    try {
      // Check if the user already exists by email or phone
      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        return res.status(400).json({
          message: "User with this email or phone number already exists",
        });
      }

      // Hash the password asynchronously
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        fullname,
        email,
        password: hashedPassword,
        phone,
        role, // Setting the selected user type as the role
      });

      const user = await newUser.save();

      // Generate JWT token for the new user
      const token = jwt.sign(
        { id: user._id, fullname: user.fullname, role: user.role },
        api_config.api.jwt_secret,
        { expiresIn: "1d" }
      );

      // Set the token as an HTTP-only cookie
      res.cookie("technology-heaven-token", token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production",
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          role: user.role,
          dateJoined: user.dateJoined,
          code: token,
        },
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error creating user", error: err.message });
    }
  },

  async login_user(req, res) {
    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user._id, fullname: user.fullname, role: user.role },
        api_config.api.jwt_secret,
        { expiresIn: "1d" }
      );

      // Set the token as an HTTP-only cookie
      res.cookie("technology-heaven-token", token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production",
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      // Update the last login timestamp
      user.lastLogin = new Date();
      await user.save();

      res.status(200).json({
        message: "Logged in successfully",
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          role: user.role,
          lastLogin: user.lastLogin,
          token: token,
        },
      });
    } catch (err) {
      res.status(500).json({ message: "Error logging in", error: err.message });
    }
  },

  // Logout user by clearing the token cookie
  logout_user(req, res) {
    res.cookie("technology-heaven-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  },
};

module.exports = AuthController;
