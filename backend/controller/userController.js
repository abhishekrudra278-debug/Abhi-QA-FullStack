const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { name, email, password, uid } = req.body;
        console.log("📥 Incoming Data:", { name, email, uid }); // Check karo data aa raha hai ya nahi

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("⚠️ User already exists");
            return res.status(400).json({ error: "Email already registered" });
        }

        const user = new User({ name, email, password, uid });
        
        console.log("⏳ Saving user to DB...");
        await user.save();
        console.log("✅ User saved successfully!");

        res.status(201).json({ message: "User Registered Successfully!" });
    } catch (err) {
        console.error("❌ REGISTER CRASHED:", err.message); // Ye terminal mein asli wajah batayega
        res.status(500).json({ error: err.message });
    }
};
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid Credentials" });

        // IMPORTANT: Use process.env.JWT_SECRET
        const token = jwt.sign(
            { id: user._id, uid: user.uid }, 
            process.env.JWT_SECRET || 'MySuperSecret', // Fallback if env missing
            { expiresIn: '1d' }
        );
        
        res.status(200).json({ 
    token, 
    user: { 
        name: user.name, 
        email: user.email, // Add this for easier testing
        wallet: user.wallet, 
        uid: user.uid 
    } 
});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};