const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
    roundId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    referencePrice: { 
        type: Number, 
        required: true 
    }, // BTC price in ₹ when round started
    finalPrice: { 
        type: Number 
    }, // BTC price in ₹ when round ended
    startTime: { 
        type: Date, 
        default: Date.now 
    },
    endTime: { 
        type: Date 
    },
    status: { 
        type: String, 
        enum: ['open', 'closed', 'distributed'], 
        default: 'open' 
    },
    winningsDistributed: { 
        type: Boolean, 
        default: false 
    }
});

module.exports = mongoose.model('Round', roundSchema);