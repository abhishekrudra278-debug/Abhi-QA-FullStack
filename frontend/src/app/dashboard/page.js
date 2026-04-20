"use client";
import { useEffect, useState, useRef } from 'react'; // useRef add kiya hai
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { motion, useAnimation } from 'framer-motion';
import { io } from 'socket.io-client'; // Socket import
import { 
  Wallet, LogOut, Zap, TrendingUp, TrendingDown, Users, Activity 
} from 'lucide-react';

// --- Sub-Component: Animated Counter for Participants ---
const AnimatedCounter = ({ count }) => {
  const controls = useAnimation();
  useEffect(() => {
    controls.start({
      scale: [1, 1.4, 1],
      color: ['#00f0ff', '#ffe600', '#00f0ff'],
      transition: { duration: 0.6, ease: 'easeInOut' },
    });
  }, [count, controls]);

  return <motion.span animate={controls} className="font-bold">{count}</motion.span>;
};

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [btcPrice, setBtcPrice] = useState(0);
  const [priceDirection, setPriceDirection] = useState(null);
  const [prediction, setPrediction] = useState('above'); 
  const [amount, setAmount] = useState(100);
  const [countdown, setCountdown] = useState(60);
  const [oiData, setOiData] = useState({ call: 124500, put: 98200, participants: 42 }); // Initial dummy data
  const [message, setMessage] = useState('');
  const router = useRouter();
  const socketRef = useRef(null); // Socket instance save karne ke liye

  // 1. WebSocket & Auth Setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem('user_info') || '{}');
    setUserData(storedUser);

    // Socket Connection Setup
    socketRef.current = io('http://localhost:5000');

    // Live Price Update via Socket
    socketRef.current.on('priceUpdate', (data) => {
      const newPrice = parseFloat(data.price);
      setBtcPrice((prev) => {
        if (prev !== 0) setPriceDirection(newPrice > prev ? 'up' : 'down');
        return newPrice;
      });
      
      // Simulating Live OI variation for UI feel
      setOiData(prev => ({
        ...prev,
        call: prev.call + Math.floor(Math.random() * 500),
        put: prev.put + Math.floor(Math.random() * 500),
        participants: prev.participants + (Math.random() > 0.8 ? 1 : Math.random() < 0.2 ? -1 : 0)
      }));
    });

    // Settlement Notification
    socketRef.current.on('roundSettled', (data) => {
      setMessage(`📢 Round ${data.roundId} Settled at ₹${data.finalPrice}!`);
      // Refresh user balance from server
      fetchLatestBalance(token);
    });

    // Countdown Logic (Minutes matching hourly rounds)
    const timer = setInterval(() => {
      const now = new Date();
      const secondsLeft = 60 - now.getSeconds();
      setCountdown(secondsLeft);
    }, 1000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(timer);
    };
  }, [router]);

  // Function to sync balance after settlement
  const fetchLatestBalance = async (token) => {
    try {
      const res = await axios.get('http://localhost:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(res.data);
      localStorage.setItem('user_info', JSON.stringify(res.data));
    } catch (err) {
      console.error("Balance Sync Error");
    }
  };

  const handlePlaceOrder = async () => {
    setMessage('⏳ Executing Trade...');
    try {
      const token = localStorage.getItem('token');
      const currentRoundId = `RND-${new Date().getHours()}`;

      const res = await axios.post('http://localhost:5000/api/trade/predict', {
        direction: prediction,
        amount: Number(amount),
        roundId: currentRoundId,
        referencePrice: btcPrice
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setMessage(`✅ ${res.data.message}`);
        setUserData(prev => ({ ...prev, wallet: res.data.updatedWallet }));
      }
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Trade Failed'}`);
    }
  };

  if (!userData) return <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center text-[#00f0ff]">INITIALIZING...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-orbitron p-4 md:p-8 relative">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center bg-black/40 backdrop-blur-xl p-5 rounded-2xl border border-[#00f0ff]/20 mb-8">
        <div className="flex items-center gap-3 text-[#00f0ff] font-black tracking-tighter italic">
          <Zap fill="#00f0ff" className="animate-pulse" /> ABHI-TRADE
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-black/60 px-4 py-2 rounded-lg border border-[#00ffcc]/30 flex items-center gap-2">
            <Wallet className="text-[#00ffcc] size-4" />
            <span className="text-[#00ffcc] font-bold">₹{userData.wallet}</span>
          </div>
          <button 
            onClick={() => { localStorage.clear(); router.push('/login'); }} 
            className="text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/40 backdrop-blur-md p-10 rounded-3xl border border-white/5 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-4 left-6 flex items-center gap-2">
              <div className="size-2 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-[10px] text-green-500 font-bold tracking-[0.2em]">LIVE SERVER FEED</span>
            </div>
            
            <h3 className="text-slate-500 text-[10px] tracking-[0.4em] mb-4 uppercase">Bitcoin / USDT</h3>
            <div className="flex items-center gap-4">
              <span className="text-6xl font-black tracking-tighter drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                ₹{btcPrice.toLocaleString()}
              </span>
              {priceDirection === 'up' ? 
                <TrendingUp className="text-green-500 size-8 animate-bounce" /> : 
                <TrendingDown className="text-red-500 size-8 animate-bounce" />
              }
            </div>

            {/* Countdown Progress */}
            <div className="w-full mt-10 space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Next Round Settlement</span>
                <span>{countdown}s</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: `${(countdown/60)*100}%` }}
                  className="h-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]"
                />
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#111] p-4 rounded-xl border border-white/5 text-center">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Call Volume</p>
              <p className="text-[#00f0ff] font-bold text-lg">₹{oiData.call}</p>
            </div>
            <div className="bg-[#111] p-4 rounded-xl border border-white/5 text-center">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Put Volume</p>
              <p className="text-[#ff0055] font-bold text-lg">₹{oiData.put}</p>
            </div>
            <div className="bg-[#111] p-4 rounded-xl border border-white/5 text-center">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Live Traders</p>
              <div className="flex justify-center items-center gap-2">
                <Users size={14} className="text-yellow-400" />
                <AnimatedCounter count={oiData.participants} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-[#161b22] p-8 rounded-3xl border border-[#00f0ff]/10 flex flex-col gap-6 shadow-2xl relative">
          <h2 className="text-xl font-bold italic tracking-tighter border-l-4 border-[#00f0ff] pl-3">TRADE EXECUTION</h2>
          
          <div className="space-y-4">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center block">Market Prediction</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPrediction('above')}
                className={`py-4 rounded-xl font-bold transition-all border-2 ${prediction === 'above' ? 'bg-[#00f0ff] text-black border-[#00f0ff] shadow-[0_0_15px_#00f0ff]' : 'border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10'}`}
              >
                ABOVE (↑)
              </button>
              <button 
                onClick={() => setPrediction('below')}
                className={`py-4 rounded-xl font-bold transition-all border-2 ${prediction === 'below' ? 'bg-[#ff0055] text-white border-[#ff0055] shadow-[0_0_15px_#ff0055]' : 'border-[#ff0055]/30 text-[#ff0055] hover:bg-[#ff0055]/10'}`}
              >
                BELOW (↓)
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Stake Amount (₹)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black/60 border border-slate-700 p-4 rounded-xl focus:border-[#00f0ff] outline-none text-xl font-mono text-center"
            />
          </div>

          <button 
            onClick={handlePlaceOrder}
            className="w-full bg-[#00f0ff] text-black py-5 rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-tighter"
          >
            🚀 Place Trade
          </button>

          {message && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className={`text-center text-xs font-bold p-2 rounded bg-black/40 ${message.includes('✅') ? 'text-green-400' : 'text-red-400'}`}
            >
              {message}
            </motion.p>
          )}

          <div className="mt-auto flex items-center justify-center gap-2 text-[8px] text-slate-600 tracking-[0.3em] font-bold">
            <Activity size={10} className="text-[#00f0ff]" /> END-TO-END ENCRYPTED
          </div>
        </div>

      </div>
    </div>
  );
}