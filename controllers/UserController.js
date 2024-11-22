const UserService = require('../services/UserService');

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
                message: 'User role updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateBusinessProfile(req, res) {
        try {
            const { userId } = req.params;
            const businessData = req.body;

            // Ensure users can only update their own business profile
            if (req.user.id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized to update this business profile'
                });
            }

            const user = await UserService.updateBusinessProfile(userId, businessData);

            res.json({
                success: true,
                user,
                message: 'Business profile updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getUsersByRole(req, res) {
        try {
            const { role, status } = req.query;

            // Only admins can fetch users by role
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only administrators can fetch users by role'
                });
            }

            const users = await UserService.getUsersByRole(role, status);

            res.json({
                success: true,
                users,
                count: users.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getUserById(req, res) {
        try {
            const { userId } = req.query;
            
            const user = await UserService.getUsersById(userId);

            res.json({
                success: true,
                user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new UserController();