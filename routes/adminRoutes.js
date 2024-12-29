const express = require("express");
const router = express.Router();
const StatsController = require("../controllers/StatsController");

// Create or Get Chat
router.get("/getStats", StatsController.getStats);

module.exports = router;
