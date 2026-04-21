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
        validate: {
            validator: function(v) {
                // Minimum 3 characters, starts with a letter
                return /^[a-zA-Z]{1,}[a-zA-Z\s]{2,29}$/.test(v.trim());
            },
            message: "Name must start with a letter and contain only alphabets/spaces (3-30 chars)."
        }
    },
    email: { 
        type: String, 
        required: [true, "Email is required"], 
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please use a valid email format"]
    },
    password: { 
        type: String, 
        required: [true, "Password is required"],
        validate: {
            validator: function(v) {
                // Complexity: Uppercase, Lowercase, Number, Special Char
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
            },
            message: "Password must be 8+ chars with uppercase, lowercase, number, and special character."
        }
    },
    wallet: { 
        type: Number, 
        default: 1000 
    } 
}, { timestamps: true });

// --- FIX: Async pre-save hook without 'next' ---
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;

    try {
        console.log(`🔐 Hashing password for: ${this.email}`);
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        // Async function mein 'next()' call nahi karte, bas return kafi hai
    } catch (err) {
        console.error("❌ Hashing Error:", err.message);
        throw err; // Mongoose automatically handle kar lega catch block mein
    }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);