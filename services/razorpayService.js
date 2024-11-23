// razorpayService.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }

    async createOrder(amount, currency = 'INR', receipt) {
        try {
            const options = {
                amount: amount * 100, // Convert to smallest currency unit (paise)
                currency,
                receipt,
                payment_capture: 1 // Auto capture payment
            };

            const order = await this.razorpay.orders.create(options);
            return order;
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw new Error('Failed to create payment order');
        }
    }

    async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        try {
            // Verify payment signature
            const generatedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpayOrderId}|${razorpayPaymentId}`)
                .digest('hex');

            if (generatedSignature !== razorpaySignature) {
                throw new Error('Invalid payment signature');
            }

            // Fetch payment details
            const payment = await this.razorpay.payments.fetch(razorpayPaymentId);
            
            return {
                verified: true,
                payment
            };
        } catch (error) {
            console.error('Payment verification failed:', error);
            throw new Error('Payment verification failed');
        }
    }

    async refundPayment(paymentId, amount) {
        try {
            const refund = await this.razorpay.payments.refund(paymentId, {
                amount: amount * 100 // Convert to smallest currency unit
            });
            return refund;
        } catch (error) {
            console.error('Refund failed:', error);
            throw new Error('Failed to process refund');
        }
    }

    async getPaymentDetails(paymentId) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            return payment;
        } catch (error) {
            console.error('Failed to fetch payment details:', error);
            throw new Error('Failed to fetch payment details');
        }
    }
}

module.exports = new RazorpayService();