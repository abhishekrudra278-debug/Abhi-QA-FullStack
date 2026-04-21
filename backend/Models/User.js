const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    uid: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    name: { 
        type: String, 
        required: [true, "Name is required"],
        trim: true,
        match: [/^[a-zA-Z\s]{3,30}$/, "Name should only contain alphabets and spaces (3-30 chars)"]
    },
    email: { 
        type: String, 
        required: [true, "Email is required"], 
        unique: true,
        lowercase: true, // Sabse zaruri: test@ vs TEST@ fix
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
    },
    password: { 
        type: String, 
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters long"]
    },
    wallet: { 
        type: Number, 
        default: 1000 
    } 
}, { timestamps: true }); // Taaki pata chale user kab register hua

// Password hashing before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        console.log(`🔐 Hashing password for: ${this.email}`);
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);