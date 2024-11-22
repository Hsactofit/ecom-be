const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const routes = require("./routes/index");
const config = require('./config/appConfig');

const app = express();

// Middleware
app.use(cors({
    origin: config.server.frontendUrl || "*",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount all routes
app.use(routes);

// Database Connection
mongoose
    .connect(config.database.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Successfully connected to the database"))
    .catch((err) => {
        console.error("Could not connect to the database. Exiting now...", err);
        process.exit();
    });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: config.server.env === 'development' ? err.message : "Something went wrong!"
    });
});

// Start the server
const PORT = config.server.port;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});