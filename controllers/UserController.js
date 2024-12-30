const User = require("../models/User");
const UserService = require("../services/UserService");

class UserController {
  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role, status } = req.body;

      // Only admins can change roles
      // if (req.user.role !== 'admin') {
      //     return res.status(403).json({
      //         success: false,
      //         message: 'Only administrators can update user roles'
      //     });
      // }

      const user = await UserService.updateUserRole(userId, role, status);

      res.json({
        success: true,
        user,
        message: "User role updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateBusinessProfile(req, res) {
    try {
      const { userId } = req.params;
      const businessData = req.body;

      // Ensure users can only update their own business profile
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to update this business profile",
        });
      }

      const user = await UserService.updateBusinessProfile(
        userId,
        businessData
      );

      res.json({
        success: true,
        user,
        message: "Business profile updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUsersByRole(req, res) {
    try {
      const { role, status } = req.query;

      // Only admins can fetch users by role
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can fetch users by role",
        });
      }

      const users = await UserService.getUsersByRole(role, status);

      res.json({
        success: true,
        users,
        count: users.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { userId } = req.query;

      const user = await UserService.getUsersById(userId);

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async acceptUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await UserService.updateVerificationStatus(userId, true);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res
        .status(200)
        .json({ message: "User accepted successfully", user });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error accepting user", error: error.message });
    }
  }

  async rejectUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await UserService.updateVerificationStatus(userId, false);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res
        .status(200)
        .json({ message: "User rejected successfully", user });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error rejecting user", error: error.message });
    }
  }

  async getAllSellers(req, res) {
    try {
      const sellers = await UserService.getAllSellers();

      if (!sellers.length) {
        return res.status(404).json({ message: "No sellers found" });
      }

      return res
        .status(200)
        .json({ message: "Sellers retrieved successfully", sellers });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error retrieving sellers", error: error.message });
    }
  }

  async searchSellers(req, res) {
    const { query, excludeId, page = 1 } = req.query; // Default page is 1
    const limit = 3; // Maximum 4 records per page

    try {
      if (!query || query.trim() === "") {
        return res
          .status(400)
          .json({ success: false, message: "Search query is required." });
      }

      // Call the service method
      const result = await UserService.searchSellers(
        query,
        excludeId,
        parseInt(page),
        limit
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error searching sellers:", error);
      res.status(500).json({
        success: false,
        message: "Error searching sellers.",
        error: error.message,
      });
    }
  }

  async addAddress(req, res) {
    try {
      const { userId } = req.params;
      const address = req.body;

      console.log("Request received..", address);

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.address.push(address);
      await user.save();

      res
        .status(201)
        .json({ message: "Address added successfully", address: user.address });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Error adding address", error: error.message });
    }
  }

  async editAddress(req, res) {
    try {
      const { userId, addressId } = req.params;
      const updatedAddress = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const addressIndex = user.address.findIndex(
        (addr) => addr._id.toString() === addressId
      );
      if (addressIndex === -1) {
        return res.status(404).json({ message: "Address not found" });
      }

      user.address[addressIndex] = {
        ...user.address[addressIndex]._doc,
        ...updatedAddress,
      };
      await user.save();

      res.status(200).json({
        message: "Address updated successfully",
        address: user.address,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating address", error: error.message });
    }
  }

  async deleteAddress(req, res) {
    try {
      const { userId, addressId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.address = user.address.filter(
        (addr) => addr._id.toString() !== addressId
      );
      await user.save();

      res.status(200).json({
        message: "Address deleted successfully",
        address: user.address,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting address", error: error.message });
    }
  }

  async getUserAddresses(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ addresses: user.address });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching addresses", error: error.message });
    }
  }
}

module.exports = new UserController();
