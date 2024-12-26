const Chat = require("../models/Chat");

exports.getOrCreateChat = async (req, res) => {
  const { userId, otherUserId } = req.body;

  try {
    // Find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!chat) {
      // Create a new chat if not found
      chat = new Chat({
        participants: [userId, otherUserId],
        messages: [],
      });
      await chat.save();
    }

    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get or create chat", error });
  }
};


exports.getChatHistory = async (req, res) => {
    const { chatId } = req.params;
  
    try {
      const chat = await Chat.findById(chatId);
  
      if (!chat) {
        return res.status(404).json({ success: false, message: "Chat not found" });
      }
  
      res.status(200).json({ success: true, data: chat.messages });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error retrieving chat history", error });
    }
  };

exports.sendMessage = async (req, res) => {
    const { chatId, senderId, message } = req.body;
  
    try {
      // Find the chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ success: false, message: "Chat not found" });
      }
  
      // Add the new message
      const newMessage = { senderId, message, timestamp: new Date() };
      chat.messages.push(newMessage);
  
      // Update last message
      chat.lastMessage = newMessage;
  
      await chat.save();
  
      res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to send message", error });
    }
  };
  
  exports.getUserChats = async (req, res) => {
    const { userId } = req.params;
  
    try {
      const chats = await Chat.find({ participants: userId })
        .sort({ updatedAt: -1 })
        .select("participants lastMessage updatedAt")
        .populate("participants", "name");
  
      res.status(200).json({ success: true, data: chats });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch user chats", error });
    }
  };

  