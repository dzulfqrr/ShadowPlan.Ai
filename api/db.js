import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getAuth() {
    // Membaca kredensial dari Environment Variables Vercel
    const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey || !process.env.GOOGLE_SHEET_ID) {
        return null;
    }

    return new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: privateKey,
        },
        scopes: SCOPES,
    });
}

export async function getSheets() {
    const auth = getAuth();
    if (!auth) return null;
    const client = await auth.getClient();
    return google.sheets({ version: 'v4', auth: client });
}

export async function getUser(email) {
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    const SHEET_NAME = 'Users';
    
    const sheets = await getSheets();
    if (!sheets) return null; // Jika DB belum disetup, kembalikan null
    
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:F`,
        });
        
        const rows = response.data.values;
        if (!rows || rows.length === 0) return null;
        
        // Asumsi Kolom: Email[0], Name[1], Password[2], Role[3], Tokens[4], Phone[5]
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === email) {
                return {
                    rowIndex: i + 1, // Google Sheets dimulai dari baris 1
                    email: rows[i][0],
                    name: rows[i][1],
                    password: rows[i][2],
                    role: rows[i][3],
                    tokens: parseInt(rows[i][4]) || 0,
                    phone: rows[i][5] || ''
                };
            }
        }
    } catch (e) {
        console.error("Error reading sheets:", e);
    }
    return null;
}

export async function getPlans() {
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    const SHEET_NAME = 'Plans'; // Use a new sheet named "Plans"
    
    const sheets = await getSheets();
    if (!sheets) return []; // Fallback empty
    
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:D`,
        });
        
        const rows = response.data.values;
        if (!rows || rows.length <= 1) return []; // Only header or empty
        
        // Asumsi Kolom: PlanName[0], Price[1], Tokens[2], Recommended[3]
        const plans = [];
        for (let i = 1; i < rows.length; i++) {
            plans.push({
                name: rows[i][0] || 'Unknown',
                price: rows[i][1] || '0',
                tokens: parseInt(rows[i][2]) || 0,
                recommended: (rows[i][3] && rows[i][3].toLowerCase() === 'yes') ? true : false
            });
        }
        return plans;
    } catch (e) {
        console.error("Error reading plans:", e);
    }
    return [];
}

export async function createUser(userObj) {
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    const SHEET_NAME = 'Users';
    
    const sheets = await getSheets();
    if (!sheets) return { ...userObj, role: 'user', tokens: 12, phone: '' };

    try {
        // Cek jumlah pengguna untuk menentukan apakah ini pendaftar pertama (Admin)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:A`,
        });
        
        const rows = response.data.values;
        const isFirst = !rows || rows.length <= 1; // Hanya header yang ada
        
        const role = isFirst ? 'administrator' : 'user';
        const tokens = isFirst ? 999999 : 12;
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:F`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    userObj.email, 
                    userObj.name, 
                    userObj.password, // Di sistem nyata, password ini harus di-hash (bcrypt)
                    role, 
                    tokens, 
                    '' // Phone
                ]]
            }
        });
        
        return { email: userObj.email, name: userObj.name, role, tokens, phone: '' };
    } catch (e) {
        console.error("Error writing to sheets:", e);
        throw new Error("Gagal mendaftarkan user ke Database.");
    }
}

export async function deductToken(email) {
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    const SHEET_NAME = 'Users';
    
    const sheets = await getSheets();
    if (!sheets) return true; // Bypass jika setup belum selesai

    const user = await getUser(email);
    if (!user) throw new Error("User tidak ditemukan di database");

    if (user.role === 'administrator') return true;
    
    if (user.tokens <= 0) {
        throw new Error("Kuota Token Anda telah habis. Silakan Upgrade ke Premium.");
    }

    const newTokens = user.tokens - 1;
    
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!E${user.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[newTokens]]
        }
    });

    return true;
}
