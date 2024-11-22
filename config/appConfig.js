require('dotenv').config();

const appConfig = {
    server: {
        port: process.env.PORT || 3001,
        env: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL,
        baseUrl: process.env.BASE_URL,
        apiVersion: process.env.API_VERSION
    },

    database: {
        uri: process.env.MONGODB_URI
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expiry: process.env.JWT_EXPIRY
    },

    email: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM
    },

    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },

    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
    },

    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucketName: process.env.AWS_BUCKET_NAME,
        region: process.env.AWS_REGION
    }
};

// Validate required configurations
const requiredConfigs = [
    'jwt.secret',
    'database.uri',
    'email.user',
    'email.password'
];

for (const path of requiredConfigs) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], appConfig);
    if (!value) {
        throw new Error(`Missing required configuration: ${path}`);
    }
}

module.exports = appConfig;