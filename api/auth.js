import { getUser, createUser } from './db.js';

export default async function handler(req, res) {
    if (req.method === 'GET' && req.query && req.query.code) {
        return handleGithubCallback(req, res);
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, email, password, firstName, lastName } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        if (action !== 'social_login' && !password) {
            return res.status(400).json({ error: 'Password is required' });
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
        } else if (action === 'social_login') {
            let user = await getUser(email);
            if (!user) {
                if (!process.env.GOOGLE_SHEET_ID) {
                    return res.status(200).json({ 
                        success: true, 
                        user: { email, name: firstName || email.split('@')[0], role: 'administrator', tokens: 999999 }
                    });
                }
                const name = `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];
                const randomPassword = Math.random().toString(36).slice(-8);
                user = await createUser({ email, password: randomPassword, name });
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

async function handleGithubCallback(req, res) {
    const { code } = req.query;
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liqUMwhLX5Mghn6P';
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '332cea10d09e231cda5811b3cc2ddba2e592dfb1';

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code: code })
        });
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        if (!accessToken) return res.status(400).send('Failed to get access token');

        const userResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
        });
        const userData = await userResponse.json();

        const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
        });
        const emailsData = await emailResponse.json();
        
        const primaryEmailObj = emailsData.find(e => e.primary) || emailsData[0];
        const email = primaryEmailObj ? primaryEmailObj.email : null;
        if (!email) return res.status(400).send('No email found in Github account');
        
        const name = userData.name || userData.login || email.split('@')[0];

        let user = await getUser(email);
        if (!user) {
            if (!process.env.GOOGLE_SHEET_ID) {
                user = { email, name, role: 'administrator', tokens: 999999 };
            } else {
                const randomPassword = Math.random().toString(36).slice(-8);
                user = await createUser({ email, password: randomPassword, name });
            }
        }

        const redirectUrl = `/?social_login=success&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}&role=${encodeURIComponent(user.role)}&tokens=${user.tokens}`;
        res.setHeader('Location', redirectUrl);
        return res.status(302).end();
    } catch (e) {
        console.error('Github OAuth Error:', e);
        return res.status(500).send('Internal Server Error');
    }
}
