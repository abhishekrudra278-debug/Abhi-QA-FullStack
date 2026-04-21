const crypto = require('crypto'); // For Secure UUID
const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        // Controller Level Check (Fast rejection)
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Secure UUID (Non-predictable)
        const uid = `UID-${crypto.randomUUID()}`;

        const user = new User({ 
            name: name.trim(), 
            email: email.toLowerCase().trim(), 
            password, 
            uid 
        });
        
        await user.save();
        console.log(`✅ User Registered: ${email}`);
        res.status(201).json({ message: "User Registered Successfully!" });

    } catch (err) {
        console.error("❌ REGISTER ERROR:", err);

        // 1. Mongoose Validation Error (Regex/Complexity fail)
        if (err.name === 'ValidationError') {
            // Sirf pehla error message uthao aur frontend ko bhej do
            const firstError = Object.values(err.errors)[0].message;
            return res.status(400).json({ error: firstError });
        }

        // 2. Duplicate Key Error (E11000)
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
        }
        
        // 3. Fallback for other errors
        res.status(500).json({ error: "An internal server error occurred" });
    }
};

exports.login = async (req, res) => {
    let { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        email = email.toLowerCase().trim();

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid Credentials" });

        const token = jwt.sign(
            { id: user._id, uid: user.uid }, 
            process.env.JWT_SECRET || 'MySuperSecret', 
            { expiresIn: '1d' }
        );
        
        res.status(200).json({ 
            token, 
            user: { 
                name: user.name, 
                email: user.email, 
                wallet: user.wallet, 
                uid: user.uid 
            } 
        });
    } catch (err) {
        console.error("❌ LOGIN ERROR:", err.message);
        res.status(500).json({ error: "Login failed" });
    }
};