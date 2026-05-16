const db = require('../config/database');
const jwt = require('jsonwebtoken');

class AuthController {
    async login(req, res) {
        const { username, password } = req.body;
        
        try {
            // Plain text password check as requested
            const result = await db.query('SELECT * FROM app_users WHERE username = $1 AND password = $2', [username, password]);
            
            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const user = result.rows[0];
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'sane-ai-secret-key',
                { expiresIn: '24h' }
            );
            
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getMe(req, res) {
        // req.user is populated by middleware
        res.json(req.user);
    }
}

module.exports = new AuthController();
