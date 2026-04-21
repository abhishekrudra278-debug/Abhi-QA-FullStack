const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        // 1. Backend Sanitization (Garbage check)
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // 2. Strict Regex Validation (Backend safety net)
        const nameRegex = /^[a-zA-Z\s]{3,30}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!nameRegex.test(name)) return res.status(400).json({ error: "Invalid Name format" });
        if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid Email format" });
        if (password.length < 8) return res.status(400).json({ error: "Password too weak" });

        // 3. Normalization (Case-insensitivity fix)
        email = email.toLowerCase().trim();

        // 4. Duplicate Check
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists with this email" });
        }

        // 5. Generate UID in Backend (Security fix)
        const uid = `UID_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const user = new User({ name, email, password, uid });
        
        console.log(`⏳ Registering: ${email}`);
        await user.save();
        
        res.status(201).json({ message: "User Registered Successfully!" });
    } catch (err) {
        console.error("❌ REGISTER ERROR:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.login = async (req, res) => {
    let { email, password } = req.body;
    try {
        if (!email || !password) return res.status(400).json({ error: "Email and password required" });

        // Always query with lowercase email
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
        res.status(500).json({ error: "Login failed" });
    }
};