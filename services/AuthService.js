const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const twilio = require("twilio");
const { OAuth2Client } = require("google-auth-library");
const config = require("../config/appConfig");
const { logError } = require("../utils/logError");
const { default: mongoose } = require("mongoose");
const axios = require('axios');

class AuthService {
  constructor() {
    try {
      this.googleClient = new OAuth2Client(config.google.clientId);
      // this.twilioClient = twilio(
      //   config.twilio.accountSid,
      //   config.twilio.authToken
      // );
      this.accessKeyId = config.aws.accessKeyId;
      this.secretKey = config.aws.secretAccessKey;
      this.region = config.aws.region || 'us-east-1';
      this.endpoint = `https://sns.${this.region}.amazonaws.com`;
      this.service = 'sns';

      this.emailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });
    } catch (error) {
      console.error("[AuthService Constructor Error]:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async hashPassword(password) {
    try {
      if (!password || typeof password !== "string") {
        throw new Error("Invalid password format");
      }
      return await bcrypt.hash(password, 10);
    } catch (error) {
      logError("hashPassword", error, { passwordLength: password?.length });
      throw error;
    }
  }

  generateToken(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return jwt.sign({ userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiry,
      });
    } catch (error) {
      logError("generateToken", error, { userId });
      throw error;
    }
  }

  generateVerificationToken() {
    try {
      return crypto.randomBytes(32).toString("hex");
    } catch (error) {
      logError("generateVerificationToken", error);
      throw error;
    }
  }

  generateOTP() {
    try {
      return Math.floor(100000 + Math.random() * 900000).toString();
    } catch (error) {
      logError("generateOTP", error);
      throw error;
    }
  }

  async sendVerificationEmail(email, token) {
    try {
      if (!email || !token) {
        throw new Error("Email and token are required");
      }

      const verificationUrl = `${config.server.baseUrl}/verify-email/${token}`;

      await emailTransporter.sendMail({
        from: config.email.from,
        to: email,
        subject: "Email Verification",
        html: `Please click <a href="${verificationUrl}">here</a> to verify your email.`,
      });

      console.log("[AuthService sendVerificationEmail Success]:", {
        email,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logError("sendVerificationEmail", error, {
        email,
        tokenLength: token?.length,
      });
      throw error;
    }
  }

  // async sendPhoneVerification(phone, code) {
  //   try {
  //     if (!phone || !code) {
  //       throw new Error("Phone number and code are required");
  //     }
  //
  //     await this.twilioClient.messages.create({
  //       body: `Your verification code is: ${code}`,
  //       to: phone,
  //       messagingServiceSid: config.twilio.messagingServiceSid,
  //     });
  //
  //     console.log("[AuthService sendPhoneVerification Success]:", {
  //       phone: phone.slice(-4), // Log only last 4 digits for privacy
  //       timestamp: new Date().toISOString(),
  //     });
  //   } catch (error) {
  //     logError("sendPhoneVerification", error, {
  //       phone: phone?.slice(-4),
  //       hasCode: !!code,
  //     });
  //     throw error;
  //   }
  // }

  async sendPhoneVerification(phone, code) {
    try {
      if (!phone || !code) {
        throw new Error("Phone number and code are required");
      }

      const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');

      // Parameters for the request
      const params = {
        Action: 'Publish',
        Message: `Your verification code is: ${code}`,
        PhoneNumber: phone,
        'MessageAttributes.entry.1.Name': 'AWS.SNS.SMS.SMSType',
        'MessageAttributes.entry.1.Value.DataType': 'String',
        'MessageAttributes.entry.1.Value.StringValue': 'Transactional',
        SignatureMethod: 'HmacSHA256',
        SignatureVersion: '2',
        Timestamp: timestamp,
        Version: '2010-03-31',
        AWSAccessKeyId: this.accessKeyId
      };

      // Create the canonical string
      const canonicalQueryString = Object.keys(params)
          .sort()
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
          .join('&');

      // Create the string to sign
      const stringToSign = [
        'POST',
        `sns.${this.region}.amazonaws.com`,
        '/',
        canonicalQueryString
      ].join('\n');

      // Calculate signature
      const signature = crypto
          .createHmac('sha256', this.secretKey)
          .update(stringToSign)
          .digest('base64');

      // Add signature to parameters
      params.Signature = signature;

      // Convert params to query string
      const finalQueryString = Object.keys(params)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
          .join('&');

      // Make the request
      const response = await axios.post(
          `https://sns.${this.region}.amazonaws.com/`,
          finalQueryString,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Host': `sns.${this.region}.amazonaws.com`
            }
          }
      );

      console.log("[AuthService sendPhoneVerification Success]:", {
        phone: phone.slice(-4),
        timestamp: new Date().toISOString(),
      });

      return response.data;

    } catch (error) {
      console.error("[AuthService sendPhoneVerification Error]:", {
        phone: phone?.slice(-4),
        hasCode: !!code,
        error: error.message,
        details: error.response?.data
      });
      throw error;
    }
  }

  async verifyGoogleToken(token) {
    try {
      if (!token) {
        throw new Error("Google token is required");
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: config.google.clientId,
      });

      console.log("[AuthService verifyGoogleToken Success]:", {
        timestamp: new Date().toISOString(),
      });

      return ticket.getPayload();
    } catch (error) {
      logError("verifyGoogleToken", error, {
        tokenLength: token?.length,
      });
      throw error;
    }
  }

  async createUser(userData) {
    try {
      if (
        !userData ||
        !userData.email ||
        !userData.password ||
        !userData.phone
      ) {
        throw new Error("Email, password, and phone are required");
      }

      console.log("[AuthService createUser Started]:", {
        email: userData.email,
        phone: userData.phone?.slice(-4),
        timestamp: new Date().toISOString(),
      });

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error("User already exists");
      }

      const hashedPassword = await this.hashPassword(userData.password);
      const emailToken = this.generateVerificationToken();
      const phoneCode = this.generateOTP();

      const user = new User({
        ...userData,
        password: hashedPassword,
        emailVerificationToken: emailToken,
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
        phoneVerificationCode: phoneCode,
        phoneVerificationExpires: Date.now() + 10 * 60 * 1000,
      });

      await user.save();

      // Send verification emails and SMS in parallel
      await Promise.all([
        // this.sendVerificationEmail(userData.email, emailToken),
        this.sendPhoneVerification(userData.phone, phoneCode)
      ]);

      console.log("[AuthService createUser Success]:", {
        userId: user._id,
        email: userData.email,
        phone: userData.phone?.slice(-4),
        timestamp: new Date().toISOString(),
      });

      return user;
    } catch (error) {
      logError("createUser", error, {
        email: userData?.email,
        phone: userData?.phone?.slice(-4),
        validationPassed: !!(
          userData?.email &&
          userData?.password &&
          userData?.phone
        ),
      });
      throw error;
    }
  }

  async verifyLogin(email, password) {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      console.log("[AuthService verifyLogin Attempt]:", {
        email,
        timestamp: new Date().toISOString(),
      });

      const user = await User.findOne({ email });

      const collections = await mongoose.connection.db.collections();
      console.log(
        "Available collections:",
        collections.map((c) => c.collectionName)
      );

      const userCollection = mongoose.connection.db.collection(
        "your_collection_name"
      );
      const userDoc = await userCollection.findOne({ email: "pop@pop.com" });
      console.log("Direct collection query result:", userDoc);

      console.log(user);
      if (!user) {
        throw new Error("Invalid email or password");
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error("Invalid email or password");
      }

      if (!user.emailVerified) {
        throw new Error("Email not verified");
      }

      if (!user.phoneVerified) {
        throw new Error("Phone number not verified");
      }

      console.log("[AuthService verifyLogin Success]:", {
        userId: user._id,
        email,
        timestamp: new Date().toISOString(),
      });

      return user;
    } catch (error) {
      logError("verifyLogin", error, {
        email,
        hasPassword: !!password,
      });
      throw error;
    }
  }
}

module.exports = new AuthService();
