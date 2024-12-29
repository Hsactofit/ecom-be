const express = require("express");
const router = express.Router();
const chatController = require("../controllers/ChatController");

// Create or Get Chat
router.post("/getOrCreateChat", chatController.getOrCreateChat);

// Send Message
router.post("/sendMessage", chatController.sendMessage);

// Fetch Chat History
router.get("/getChatHistory/:chatId", chatController.getChatHistory);

// Fetch User's Chat Previews
router.get("/getUserChats/:userId", chatController.getUserChats);


router.get("/fetchUnreadChats", chatController.fetchUnreadChats);

module.exports = router;
