const crypto = require('crypto'); // For Secure UUID
const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        // BUG 3 Fix: Trim name and check if empty after trim
        if (!name || name.trim().length < 3) {
            return res.status(400).json({ error: "Name must be at least 3 non-empty characters" });
        }

        // BUG 6 Fix: Secure UUID (Non-predictable)
        const uid = `UID-${crypto.randomUUID()}`;

        const user = new User({ 
            name: name.trim(), 
            email: email.toLowerCase().trim(), 
            password, 
            uid 
        });
        
        await user.save();
        res.status(201).json({ message: "User Registered Successfully!" });

    } catch (err) {
        // BUG 4 & 5 Fix: Proper Error Sanitization (No raw leaks)
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
        }
        
        // Don't leak raw err.message to client in production
        console.error("Registration Error:", err); 
        res.status(500).json({ error: "An internal server error occurred" });
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