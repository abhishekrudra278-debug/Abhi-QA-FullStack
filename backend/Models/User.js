const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    uid: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    // ... other fields
    name: { 
        type: String, 
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                // BUG 3 Fix: At least 3 letters, can't be just spaces
                return /^[a-zA-Z]{1,}[a-zA-Z\s]{2,29}$/.test(v.trim());
            },
            message: "Name must start with a letter and contain only alphabets/spaces."
        }
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true,
        // BUG 1 Fix: Strict Email Regex
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please use a valid email format (e.g., test@domain.com)"]
    },
    password: { 
        type: String, 
        required: true,
        // BUG 2 Fix: Custom Password Complexity Validator
        validate: {
            validator: function(v) {
                // Min 8 chars, 1 Uppercase, 1 Lowercase, 1 Number, 1 Special Char
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
            },
            message: "Password must be 8+ chars with uppercase, lowercase, number, and special character."
        }
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