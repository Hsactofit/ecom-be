const User = require("../models/Cart");

const dropUsernameIndex = async () => {
  try {
    // Check if the `username` index exists
    const indexes = await User.collection.indexes();
    const usernameIndex = indexes.find((index) => index.name === "username_1");

    if (usernameIndex) {
      // Drop the `username` index if it exists
      await User.collection.dropIndex("username_1");
      console.log("Dropped username index successfully.");
    } else {
      console.log("Username index does not exist.");
    }
  } catch (error) {
    console.error("Error dropping username index:", error.message);
  }
};

module.exports = dropUsernameIndex;
