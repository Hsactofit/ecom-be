module.exports = {
    logError: (methodName, error, additionalInfo = {}) => {
        console.error(`[AuthService ${methodName} Error]:`, {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            ...additionalInfo
        });
        return error;
    }
};