const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    uid: { type: String, required: true }, // Firebase UID ya Custom ID
    roundId: { type: String, required: true },
    direction: { 
        type: String, 
        required: true, 
        enum: ['above', 'below'] // Automation mein 'up/down' jaisi mistakes nahi hongi
    }, 
    amount: { type: Number, required: true },
    referencePrice: { type: Number, required: true },
    status: { 
        type: String, 
        default: 'pending', 
        enum: ['pending', 'won', 'lost'] 
    },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', predictionSchema);