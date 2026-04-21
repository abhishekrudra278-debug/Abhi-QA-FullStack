require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const cors = require('cors');
const http = require('http'); // Required for Socket.io
const { Server } = require('socket.io'); // WebSocket
const WebSocket = require('ws'); // For Binance Stream

// Routes & Controllers
const tradeRoutes = require('./Routes/tradeRoutes');
const userRoutes = require('./Routes/userRoutes');
const tradeController = require('./controller/tradeController');

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
    cors: { 
        origin: "https://abhi-qa-full-stack.vercel.app",
        methods: ["GET", "POST"]
    }
});

// Middleware
// Middleware
app.use(cors({
    origin: ["https://abhi-qa-full-stack.vercel.app", "http://localhost:3000"], // Vercel + Local dono allow
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true // Agar tum cookies ya headers bhej rahe ho toh zaruri hai
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/trade', tradeRoutes);
app.use('/api/user', userRoutes);

// --- ⚡ WEBSOCKET LOGIC (Binance Live Stream) ---
const binanceWS = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

binanceWS.on('message', (data) => {
    const ticker = JSON.parse(data);
    const livePrice = parseFloat(ticker.c).toFixed(2);
    
    // Sabhi connected users ko live price bhej do
    io.emit('priceUpdate', { price: livePrice });
});

io.on('connection', (socket) => {
    console.log('👤 A user connected:', socket.id);
    socket.on('disconnect', () => console.log('👤 User disconnected'));
});

// --- ⏰ AUTOMATION: Hourly Round Settlement ---
cron.schedule('0 * * * *', async () => {
    console.log('⏰ Settlement Triggered: Closing Previous Round...');
    
    try {
        // 1. Get Final Closing Price
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const finalPrice = parseFloat(response.data.price); 

        // 2. Identify Last Round ID
        const now = new Date();
        now.setHours(now.getHours() - 1);
        const lastRoundId = `RND-${now.getHours()}`;

        console.log(`💰 Settling Round: ${lastRoundId} with Price: ${finalPrice}`);

        // 3. Settle Winnings (Calling Controller)
        // Ensure you have this function in your tradeController
        await tradeController.distributeWinnings(
            { body: { roundId: lastRoundId, finalPrice } }, 
            { status: () => ({ json: (data) => console.log("Settlement Done:", data) }) }
        );

        // 4. Announce via WebSocket to Frontend
        io.emit('roundSettled', { roundId: lastRoundId, finalPrice });

        // 5. Create New Round
        await tradeController.autoCreateRound();
        
    } catch (err) {
        console.error("❌ Cron Error:", err.message);
    }
});

// --- 📡 API ENDPOINTS ---
app.get('/api/live-price', async (req, res) => {
    try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        res.json({ price: parseFloat(response.data.price).toFixed(2) });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch price" });
    }
});

const PORT = process.env.PORT || 5000;
// CRITICAL: App.listen ki jagah server.listen use karna hai
server.listen(PORT, () => {
    console.log(`🚀 Server + WebSocket running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/live-price`);
});