const express = require('express');
const router = express.Router();
const tradeController = require('../controller/tradeController');
const auth = require('../middleware/auth'); // Middleware import kiya

// 1. PLACE PREDICTION (Ab ye route Protected hai 🔐)
router.post('/predict', auth, tradeController.placePrediction);

// 2. DISTRIBUTE WINNINGS 
// Note: Real world mein ye route sirf "Admin" ya "Cron Job" ke liye hota hai
router.post('/distribute', tradeController.distributeWinnings);

module.exports = router;