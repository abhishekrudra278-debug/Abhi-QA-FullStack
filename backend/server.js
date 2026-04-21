require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const rateLimit = require('express-rate-limit'); // Naya Import

// Routes & Controllers
const tradeRoutes = require('./Routes/tradeRoutes');
const userRoutes = require('./Routes/userRoutes');
const tradeController = require('./controller/tradeController');

const app = express();

// --- 🛡️ SECURITY & RATE LIMITING --Render/Vercel ke liye zaruri hai taaki asli IP track ho sake
app.set('trust proxy', 1);

const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minutes
    max: 5, // 1 IP se sirf 5 requests allow hain
    message: { error: "Too many registrations. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { 
        origin: "https://abhi-qa-full-stack.vercel.app",
        methods: ["GET", "POST"]
    }
});

// --- 🛠️ MIDDLEWARE ---
app.use(cors({
    origin: ["https://abhi-qa-full-stack.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- 📡 ROUTES ---
// Sirf register par limit lagao taaki login/trade block na ho galati se
app.use('/api/user/register', registerLimiter); 

app.use('/api/trade', tradeRoutes);
app.use('/api/user', userRoutes);

// --- ⚡ WEBSOCKET LOGIC (Binance) ---
const binanceWS = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
binanceWS.on('message', (data) => {
    const ticker = JSON.parse(data);
    const livePrice = parseFloat(ticker.c).toFixed(2);
    io.emit('priceUpdate', { price: livePrice });
});

io.on('connection', (socket) => {
    console.log('👤 A user connected:', socket.id);
    socket.on('disconnect', () => console.log('👤 User disconnected'));
});

// --- ⏰ CRON JOBS ---
cron.schedule('0 * * * *', async () => {
    console.log('⏰ Settlement Triggered...');
    try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const finalPrice = parseFloat(response.data.price); 
        const now = new Date();
        now.setHours(now.getHours() - 1);
        const lastRoundId = `RND-${now.getHours()}`;

        await tradeController.distributeWinnings(
            { body: { roundId: lastRoundId, finalPrice } }, 
            { status: () => ({ json: (data) => console.log("Settlement Done:", data) }) }
        );
        io.emit('roundSettled', { roundId: lastRoundId, finalPrice });
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
server.listen(PORT, () => {
    console.log(`🚀 Server + WebSocket running on port ${PORT}`);
});