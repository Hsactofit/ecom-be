const User = require('../models/User');
const { logError } = require('../utils/logError');

class UserService {
    async updateUserRole(userId, role, status = 'PENDING') {
        try {
            if (!userId || !role) {
                throw new Error('User ID and role are required');
            }

            // Validate role
            const validRoles = ['customer', 'seller', 'admin', 'reseller'];
            if (!validRoles.includes(role)) {
                throw new Error('Invalid role specified');
            }

            console.log('[UserService updateUserRole Started]:', {
                userId,
                role,
                status,
                timestamp: new Date().toISOString()
            });

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user is verified before allowing role change
            if (!user.isVerified && (role === 'seller' || role === 'reseller')) {
                throw new Error('User must be verified before becoming a seller or reseller');
            }

            // Update role and status
            user.role = role;
            user.status = status;

            // If changing to seller/reseller, ensure businessProfile exists
            if ((role === 'seller' || role === 'reseller') && !user.businessProfile) {
                user.businessProfile = {
                    storeName: '',
                    description: '',
                    location: '',
                    rating: { average: 0, count: 0 },
                    bankDetails: {},
                    earnings: { total: 0, pending: 0 }
                };
            }

            await user.save();

            console.log('[UserService updateUserRole Success]:', {
                userId,
                newRole: role,
                status,
                timestamp: new Date().toISOString()
            });

            return user;
        } catch (error) {
            logError('updateUserRole', error, { userId, role, status });
            throw error;
        }
    }

    async updateBusinessProfile(userId, businessData) {
        try {
            if (!userId || !businessData) {
                throw new Error('User ID and business data are required');
            }

            console.log('[UserService updateBusinessProfile Started]:', {
                userId,
                timestamp: new Date().toISOString()
            });

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.businessProfile) {
                throw new Error('User does not have a business profile');
            }

            // Update business profile fields
            Object.assign(user.businessProfile, businessData);
            await user.save();

            console.log('[UserService updateBusinessProfile Success]:', {
                userId,
                timestamp: new Date().toISOString()
            });

            return user;
        } catch (error) {
            logError('updateBusinessProfile', error, { userId });
            throw error;
        }
    }

    async getUsersByRole(role, status = null) {
        try {
            console.log('[UserService getUsersByRole Started]:', {
                role,
                status,
                timestamp: new Date().toISOString()
            });

            const query = { role };
            if (status) {
                query.status = status;
            }

            const users = await User.find(query).select('-password');

            console.log('[UserService getUsersByRole Success]:', {
                role,
                count: users.length,
                timestamp: new Date().toISOString()
            });

            return users;
        } catch (error) {
            logError('getUsersByRole', error, { role, status });
            throw error;
        }
    }

    async getUsersById(userId) {
        try {
            console.log('[UserService getUsersById Started]:', {
                userId,
                timestamp: new Date().toISOString()
            });


            const user = await User.findById(userId).select('-password');

            console.log('[UserService getUsersById Success]:', {
                user,
                timestamp: new Date().toISOString()
            });

            return user;
        } catch (error) {
            logError('getUsersById', error, { role, status });
            throw error;
        }
    }

    async updateVerificationStatus(userId, isVerified){
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                {
                    isVerified,
                    status: isVerified ? 'ACCEPTED' : 'REJECTED'
                },
                { new: true } // Return the updated document
            );
    
            return user;
        } catch (error) {
            throw new Error(error.message);
        }
    };

    async getAllSellers(){
        try {
            // Filter users with the role of 'seller'
            const sellers = await User.find({ role: 'seller' }).select('-password'); // Exclude password from the response
            return sellers;
        } catch (error) {
            throw new Error(error.message);
        }
    };

    async searchSellers(query) {
        try {
            const sellers = await User.find({
                role: { $in: ['seller', 'reseller'] }, // Role should be seller or reseller
                isVerified: true, // Assuming isActive is implied by your schema structure
                $or: [
                    { name: { $regex: query, $options: 'i' } }, // Search by name
                    { email: { $regex: query, $options: 'i' } }, // Search by email
                    { 'businessProfile.storeName': { $regex: query, $options: 'i' } }, // Search by store name
                    { 'businessProfile.description': { $regex: query, $options: 'i' } }, // Search by description
                    { 'businessProfile.location': { $regex: query, $options: 'i' } }, // Search by location
                ]
            }).select('-password -resetToken -resetTokenExpiration').limit(3); // Exclude sensitive fields
            return sellers;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
}

module.exports = new UserService();