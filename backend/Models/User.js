const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true }, 
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    wallet: { type: Number, default: 1000 } 
});

// Password hashing before saving
// Password hashing before saving
userSchema.pre('save', async function() {
    // Agar password modify nahi hua toh aage badho (No next needed with async)
    if (!this.isModified('password')) return;

    try {
        console.log("🔐 Hashing password...");
        this.password = await bcrypt.hash(this.password, 10);
    } catch (err) {
        throw new Error('Error hashing password: ' + err.message);
    }
});
// Is line ko update kiya hai: 
// Pehle check karega ki model exist karta hai ya nahi
module.exports = mongoose.models.User || mongoose.model('User', userSchema);