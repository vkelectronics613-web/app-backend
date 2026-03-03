const User = require('../models/User');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

// Generate 6 character referral code
const generateReferralCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

const loginUser = async (req, res) => {
    try {
        const { uid, email } = req.user;
        const { deviceId, referralCode } = req.body; // referral code entered by user during signup

        let user = await User.findOne({ uid });

        if (!user) {
            // Create new user
            let referredByUserId = null;
            let myReferralCode = generateReferralCode();

            // Check uniqueness of referral code
            while (await User.findOne({ referralCode: myReferralCode })) {
                myReferralCode = generateReferralCode();
            }

            // Check if user entered a valid referral code
            if (referralCode) {
                const referringUser = await User.findOne({ referralCode });
                if (referringUser) {
                    referredByUserId = referringUser._id;

                    // Stage 1 Referral Reward logic: Give inviter 20 coins
                    referringUser.coinBalance += 20;
                    await referringUser.save();

                    await Transaction.create({
                        user: referringUser._id,
                        type: 'EARN',
                        source: 'REFERRAL',
                        amount: 20,
                        description: `Referral sign-up bonus for new user`,
                    });
                }
            }

            user = new User({
                uid,
                email,
                deviceId,
                referralCode: myReferralCode,
                referredBy: referredByUserId,
            });

            await user.save();
        } else {
            // Update deviceId if it changed (and depending on strictness, we might block this)
            if (deviceId && user.deviceId !== deviceId) {
                // Anti-Fraud Device Lock: Permanently link deviceId to UID
                if (user.deviceId) {
                    // If a device ID already exists and it's different, it could be a warning
                    // based on rules "One deviceId permanently linked to one UID".
                    return res.status(403).json({ message: 'Device mismatch. Account is locked to a different device.' });
                } else {
                    user.deviceId = deviceId;
                    await user.save();
                }
            }
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-__v');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    loginUser,
    getUserProfile,
};
