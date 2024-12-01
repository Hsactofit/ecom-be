const AuthService = require('../services/AuthService');
const User = require('../models/User');

class AuthController {
    async signup(req, res) {
        try {
            const { email, phone } = req.body;

            // Check existing user
            const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email or phone already registered'
                });
            }

            const user = await AuthService.createUser(req.body);
            const token = AuthService.generateToken(user._id);

            res.status(201).json({
                success: true,
                token,
                message: 'Please verify your email and phone'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await AuthService.verifyLogin(email, password);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            if (!user.emailVerified || !user.phoneVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Please verify your email and phone'
                });
            }

            const token = AuthService.generateToken(user._id);
            user.lastLogin = Date.now();
            await user.save();
            
            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async googleSignIn(req, res) {
        try {
            const { token } = req.body;
            const payload = await AuthService.verifyGoogleToken(token);

            let user = await User.findOne({ email: payload.email });

            if (!user) {
                user = await User.create({
                    name: payload.name,
                    email: payload.email,
                    password: crypto.randomBytes(32).toString('hex'),
                    emailVerified: true,
                    phone: null,
                });
            }

            const jwtToken = AuthService.generateToken(user._id);

            res.json({
                success: true,
                token: jwtToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async verifyEmail(req, res) {
        try {
            const { token } = req.params;
            const user = await User.findOne({
                emailVerificationToken: token,
                emailVerificationExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired verification token'
                });
            }

            user.emailVerified = true;
            user.emailVerificationToken = undefined;
            user.emailVerificationExpires = undefined;
            await user.save();

            res.json({
                success: true,
                message: 'Email verified successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async verifyPhone(req, res) {
        try {
            const { phone, code } = req.body;
            const user = await User.findOne({
                phone,
                phoneVerificationCode: code,
                phoneVerificationExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired verification code'
                });
            }

            user.phoneVerified = true;
            user.phoneVerificationCode = undefined;
            user.phoneVerificationExpires = undefined;
            await user.save();

            res.json({
                success: true,
                message: 'Phone verified successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async resendVerification(req, res) {
        try {
            const { type } = req.query;
            const user = await User.findById(req.user.id);

            if (type === 'email') {
                const emailToken = AuthService.generateVerificationToken();
                user.emailVerificationToken = emailToken;
                user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
                await user.save();
                await AuthService.sendVerificationEmail(user.email, emailToken);
            } else if (type === 'phone') {
                const phoneCode = AuthService.generateOTP();
                user.phoneVerificationCode = phoneCode;
                user.phoneVerificationExpires = Date.now() + 10 * 60 * 1000;
                await user.save();
                await AuthService.sendPhoneVerification(user.phone, phoneCode);
            }

            res.json({
                success: true,
                message: `${type} verification resent successfully`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new AuthController();