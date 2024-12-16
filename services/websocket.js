const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handleConnect = async (event) => {
    const connectionId = event.requestContext.connectionId;

    await dynamoDB.put({
        TableName: 'WebSocketConnections',
        Item: {
            connectionId: connectionId,
            timestamp: Date.now()
        }
    }).promise();

    return { statusCode: 200 };
};

exports.handleDisconnect = async (event) => {
    const connectionId = event.requestContext.connectionId;

    await dynamoDB.delete({
        TableName: 'WebSocketConnections',
        Key: {
            connectionId: connectionId
        }
    }).promise();

    return { statusCode: 200 };
};

exports.handleMessage = async (event) => {
    const connectionId = event.requestContext.connectionId;
    const body = JSON.parse(event.body);

    switch(body.type) {
        case 'becomeSellerRequest':
            await broadcastNotification({
                type: 'SELLER_REQUEST',
                title: 'New Seller Request',
                message: `${body.customerName} has requested to become seller`,
                requestId: body.requestId,
                timestamp: new Date()
            });
            break;

        case 'productApprovalRequest':
            await broadcastNotification({
                type: 'PRODUCT_REQUEST',
                title: 'New Product Request',
                message: `${body.businessName} has made a product request`,
                requestId: body.requestId,
                productId: body.productId,
                timestamp: new Date()
            });
            break;
    }

    return { statusCode: 200 };
};