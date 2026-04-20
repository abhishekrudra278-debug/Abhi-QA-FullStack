const User = require('../Models/User');
const Prediction = require('../Models/Prediction');
const Round = require('../Models/Round'); 
const mongoose = require('mongoose');
const axios = require('axios');

// 1. PLACE PREDICTION
exports.placePrediction = async (req, res) => {
    const { roundId, direction, amount, referencePrice } = req.body;
    const userUid = req.user?.uid || req.user?.id; 

    try {
        const betAmount = Number(amount);
        if (betAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

        // Atomic Update: Deduct balance strictly
        const user = await User.findOneAndUpdate(
            { uid: userUid, wallet: { $gte: betAmount } }, 
            { $inc: { wallet: -betAmount } },
            { returnDocument: 'after' } 
        );
        
        if (!user) {
            return res.status(400).json({ error: "Insufficient Balance or User not found" });
        }

        const newPrediction = new Prediction({ 
            uid: userUid, 
            roundId: roundId || ("RND-" + new Date().getHours()), 
            direction, 
            amount: betAmount, 
            referencePrice: referencePrice || 0, // Prevent validation error
            status: 'pending' 
        });
        await newPrediction.save();

        res.status(200).json({ 
            success: true, 
            message: `₹${betAmount} deduct ho gaye. Bet placed!`,
            updatedWallet: user.wallet 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. DISTRIBUTE WINNINGS
exports.distributeWinnings = async (req, res) => {
    const { roundId, finalPrice } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const allPredictions = await Prediction.find({ roundId, status: 'pending' }).session(session);
        
        if (allPredictions.length === 0) {
            await session.abortTransaction();
            return res.status(404).json({ message: "No pending bets" });
        }

        let totalPool = 0;
        let winners = [];
        let totalWinningBetAmount = 0;

        allPredictions.forEach(pred => {
            totalPool += pred.amount;
            const isWinner = (pred.direction === 'above' && finalPrice > pred.referencePrice) ||
                             (pred.direction === 'below' && finalPrice < pred.referencePrice);
            
            if (isWinner) {
                winners.push(pred);
                totalWinningBetAmount += pred.amount;
            }
        });

        // Agar koi winner nahi hai
        if (winners.length === 0) {
            await Prediction.updateMany({ roundId, status: 'pending' }, { status: 'lost' }, { session });
            await session.commitTransaction();
            return res.status(200).json({ message: "All lost. House wins." });
        }

        // Platform Fee (10%)
        const platformFee = Math.floor(totalPool * 0.10);
        const distributablePool = totalPool - platformFee;

        // Rewards Distribution
        for (let winner of winners) {
            const shareRatio = winner.amount / totalWinningBetAmount;
            const reward = Math.floor(shareRatio * distributablePool);

            await User.findOneAndUpdate(
                { uid: winner.uid },
                { $inc: { wallet: reward } }, // Reward wapas dena
                { session }
            );

            winner.status = 'won';
            await winner.save({ session });
        }

        // Loosers
        await Prediction.updateMany(
            { roundId, status: 'pending' }, 
            { status: 'lost' }, 
            { session }
        );

        await session.commitTransaction();
        res.status(200).json({ success: true, pool: totalPool });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

// 3. AUTO CREATE ROUND
exports.autoCreateRound = async () => {
    try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const btcPrice = parseFloat(response.data.price);
        
        const newRound = new Round({
            roundId: "RND-" + new Date().getHours(),
            referencePrice: btcPrice,
            startTime: new Date(),
            status: 'open'
        });

        await newRound.save();
        console.log(`✅ Round Created: ${newRound.roundId}`);
    } catch (err) {
        console.error("❌ Auto-Round Error:", err.message);
    }
};