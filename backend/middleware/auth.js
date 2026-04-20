const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Header check (Authorization: Bearer <token>)
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ error: "Access Denied. No token provided." });

    const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'MySuperSecret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid or Expired Token" });
    }
};