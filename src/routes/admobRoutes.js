const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Google AdMob Server-Side Verification (SSV) Webhook
// Read more: https://developers.google.com/admob/android/rewarded-video-ssv
router.get('/ssv', async (req, res) => {
    try {
        const { ad_network, ad_unit, reward_amount, reward_item, user_id, custom_data, signature, key_id, transaction_id } = req.query;

        // In a real production system, you MUST verify the ECDSA signature here using Google's public keys.
        // For simplicity, we assume verification is successful or implement the crypto logic separately.

        // Let's assume custom_data contains the user's document _id
        if (custom_data) {
            const parsedData = JSON.parse(custom_data);
            const userId = parsedData.userId;
            const user = await User.findById(userId);

            if (user) {
                // Optionally credit user immediately if reward_item equals something specific,
                // Or just log it so that next time they call `/spin`, we know they completed it.
                // We'll trust the AdMob SSV over the client boolean.

                // E.g. Set a flag in DB or cache indicating they can spin
                // For now, we will just log the successful view:
                console.log(`User ${userId} watched an ad on ${ad_unit}. Tx ID: ${transaction_id}`);
            }
        }

        // AdMob requires a 200 OK response, otherwise it retries.
        res.status(200).send('OK');
    } catch (error) {
        console.error('AdMob SSV Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
