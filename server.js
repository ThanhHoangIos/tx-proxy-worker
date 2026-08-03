const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');

// Đọc dữ liệu
let history = [];
if (fs.existsSync(DATA_FILE)) {
    try {
        history = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        console.log(`📊 Đã đọc ${history.length} bản ghi`);
    } catch(e) {
        history = [];
    }
}

// Lưu dữ liệu
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));
        return true;
    } catch(e) {
        console.error('❌ Lỗi lưu:', e);
        return false;
    }
}

// ============================================================
//  📌 API
// ============================================================

// POST /api/result - Nhận kết quả
app.post('/api/result', (req, res) => {
    const data = req.body;
    
    if (!data.session || !data.dice || data.dice.length !== 3) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }
    
    const exists = history.some(h => h.session === data.session);
    if (exists) {
        return res.json({ success: false, message: 'Đã tồn tại', total: history.length });
    }
    
    if (!data.time) data.time = new Date().toISOString();
    history.push(data);
    saveData();
    
    console.log(`✅ Lưu: Ván ${data.session} | ${data.dice.join('+')} = ${data.total} → ${data.result}`);
    res.json({ success: true, message: 'Đã lưu', total: history.length });
});

// GET /api/history - Lấy lịch sử
app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    res.json({
        total: history.length,
        results: history.slice(-limit)
    });
});

// GET /api/latest - Lấy kết quả mới nhất
app.get('/api/latest', (req, res) => {
    res.json({
        total: history.length,
        latest: history[history.length - 1] || null
    });
});

// GET /api/stats - Thống kê
app.get('/api/stats', (req, res) => {
    const total = history.length;
    if (total === 0) {
        return res.json({ total: 0, tai: 0, xiu: 0, taiPercent: 0, xiuPercent: 0 });
    }
    
    const tai = history.filter(h => h.result === 'Tài').length;
    const xiu = total - tai;
    
    res.json({
        total,
        tai,
        xiu,
        taiPercent: (tai / total * 100).toFixed(1),
        xiuPercent: (xiu / total * 100).toFixed(1)
    });
});

// GET /api/predict - Dự đoán
app.get('/api/predict', (req, res) => {
    const total = history.length;
    if (total < 10) {
        return res.json({
            predict: 'Chưa đủ dữ liệu',
            confidence: 0,
            message: `Cần ít nhất 10 ván (hiện có ${total})`,
            total
        });
    }
    
    const last10 = history.slice(-10);
    const tai10 = last10.filter(h => h.result === 'Tài').length;
    const xiu10 = 10 - tai10;
    
    const predict = tai10 > xiu10 ? 'Tài' : 'Xỉu';
    const confidence = tai10 > xiu10 ? (tai10 / 10 * 100) : (xiu10 / 10 * 100);
    
    res.json({
        predict,
        confidence: confidence.toFixed(1),
        last10: { tai: tai10, xiu: xiu10 },
        total
    });
});

// DELETE /api/clear - Xóa dữ liệu
app.delete('/api/clear', (req, res) => {
    history = [];
    saveData();
    res.json({ success: true, message: 'Đã xóa toàn bộ' });
});

// ============================================================
//  🚀 START
// ============================================================
app.listen(PORT, () => {
    console.log(`\n✅ API Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📊 Hiện có ${history.length} bản ghi`);
    console.log('\n📌 CÁC API:');
    console.log(`  POST   /api/result  - Gửi kết quả`);
    console.log(`  GET    /api/history - Lấy lịch sử`);
    console.log(`  GET    /api/latest  - Kết quả mới nhất`);
    console.log(`  GET    /api/stats   - Thống kê`);
    console.log(`  GET    /api/predict - Dự đoán`);
    console.log(`  DELETE /api/clear   - Xóa dữ liệu`);
});
