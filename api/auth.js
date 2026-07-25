import { getUser, createUser } from './db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, email, password, firstName, lastName } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (action === 'signup') {
            const existingUser = await getUser(email);
            if (existingUser) {
                return res.status(400).json({ error: 'Email sudah terdaftar.' });
            }
            
            const name = `${firstName || ''} ${lastName || ''}`.trim();
            const newUser = await createUser({ email, password, name });
            
            return res.status(200).json({ success: true, user: newUser });
            
        } else if (action === 'login') {
            const user = await getUser(email);
            if (!user) {
                // Bypass logic for testing before DB setup
                if (!process.env.GOOGLE_SHEET_ID) {
                    return res.status(200).json({ 
                        success: true, 
                        user: { email, name: 'Test User', role: 'administrator', tokens: 999999 }
                    });
                }
                return res.status(400).json({ error: 'Akun tidak ditemukan.' });
            }
            
            if (user.password !== password) {
                return res.status(401).json({ error: 'Password salah.' });
            }
            
            return res.status(200).json({ success: true, user });
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (e) {
        console.error("Auth API Error:", e);
        return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
}
