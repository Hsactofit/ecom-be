const Chat = require("../models/Chat");


exports.fetchUnreadChats = async (req, res) => {
  const { userId } = req.query; // Extract userId from query params

  try {
    // Find all chats where the user has unread messages
    const chats = await Chat.find({
      [`unreadCount.${userId}`]: { $gt: 0 }, // Match chats with unread count greater than 0 for the user
    })
      .select("participants lastMessage unreadCount") // Select only necessary fields
      .populate("participants", "name"); // Populate participant names

    // Transform the response
    const unreadChats = chats.map((chat) => ({
      chatId: chat._id,
      participants: chat.participants,
      lastMessage: chat.lastMessage,
      unreadCount: chat.unreadCount.get(userId) || 0, // Get unread count for the user
    }));

    return res.status(200).json({ success: true, unreadChats });
  } catch (error) {
    console.error("Error fetching unread chats:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch unread chats", error });
  }
};

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

exports.fetchChatUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all chats where the user is a participant
    const chats = await Chat.find({
      participants: userId,
      // Ensure both participants exist
      $expr: {
        $eq: [{ $size: "$participants" }, 2]
      }
    })
    .populate({
      path: 'participants',
      match: { _id: { $ne: userId } }, // Only populate the other participant
      select: 'name email status' // Select needed fields
    })
    .select('participants lastMessage unreadCount');

    // Filter out any chats where population failed (null participants)
    const validChats = chats.filter(chat => 
      chat.participants && 
      chat.participants.length > 0 && 
      chat.participants[0] !== null
    );
    console.log("valid", validChats);
    // Extract and format the users with their last message and unread count
    const chatUsers = validChats.map(chat => {
      const otherUser = chat.participants[0];
      return {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        status: otherUser.status,
        lastMessage: chat.lastMessage,
        unreadCount: chat?.unreadCount?.get(userId.toString()) || 0
      };
    });

    res.status(200).json({
      success: true,
      sellers: chatUsers,
      count: chatUsers.length
    });

  } catch (error) {
    console.error('Fetch chat users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat users',
      error: error.message
    });
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

  