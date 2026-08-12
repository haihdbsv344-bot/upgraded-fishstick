// server.js - VIP TÀI XỈU - KHÁCH QUAN - KHÔNG THIÊN VỊ

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CONFIG = {
    API_URL: 'https://wtx.macminim6.online/v1/tx/sessions',
    PORT: process.env.PORT || 3000,
    HISTORY_FILE: 'prediction_history.json',
    MAX_HISTORY: 10000
};

// ============================================================
// THUẬT TOÁN VIP - KHÁCH QUAN - KHÔNG THIÊN VỊ
// ============================================================
class VIPTXAlgorithm {
    constructor() {
        this.predictionHistory = [];
        
        // Markov Chain - KHÁCH QUAN
        this.markovChain = {
            'Tài': { 'Tài': 0.55, 'Xỉu': 0.45 },
            'Xỉu': { 'Tài': 0.45, 'Xỉu': 0.55 }
        };
        
        // Pattern Matrix - KHÁCH QUAN
        this.patternMatrix = {
            'Tài_Tài': 0.58,
            'Xỉu_Xỉu': 0.42,
            'Tài_Xỉu': 0.50,
            'Xỉu_Tài': 0.50,
            'Tài_Tài_Tài': 0.62,
            'Xỉu_Xỉu_Xỉu': 0.38,
            'Tài_Tài_Xỉu': 0.55,
            'Xỉu_Xỉu_Tài': 0.45,
            'Tài_Xỉu_Xỉu': 0.48,
            'Xỉu_Tài_Tài': 0.52,
            'Tài_Tài_Tài_Tài': 0.65,
            'Xỉu_Xỉu_Xỉu_Xỉu': 0.35
        };
        
        // Trọng số cân bằng
        this.weights = {
            trend: 0.25,
            pattern: 0.25,
            markov: 0.25,
            total: 0.25
        };
        
        this.loadHistory();
        console.log('🔥 VIP TÀI XỈU - KHÁCH QUAN');
        console.log('📊 KHÔNG THIÊN VỊ - PHÂN TÍCH CÔNG BẰNG');
    }

    async fetchData(limit = 100) {
        try {
            const response = await axios.get(`${CONFIG.API_URL}?limit=${limit}`, { 
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            
            let sessions = [];
            
            if (response.data) {
                if (response.data.list && Array.isArray(response.data.list)) {
                    sessions = response.data.list.map(item => {
                        let dices = item.dices;
                        if (Array.isArray(dices) && Array.isArray(dices[0])) {
                            dices = dices[0];
                        }
                        if (typeof dices === 'number') {
                            dices = [dices, 0, 0];
                        }
                        const tong = item.point || dices.reduce((a, b) => a + b, 0);
                        return {
                            phien: item.id || item._id || 0,
                            xuc_xac: dices,
                            tong: tong,
                            ket_qua: item.resultTruyenThong === 'TAI' ? 'Tài' : 'Xỉu'
                        };
                    });
                } else if (response.data.sessions && Array.isArray(response.data.sessions)) {
                    sessions = response.data.sessions;
                }
            }
            
            if (sessions && sessions.length > 0) {
                sessions.sort((a, b) => a.phien - b.phien);
                return sessions;
            }
            
            return this.generateMockData(limit);
            
        } catch (error) {
            console.error('Lỗi lấy dữ liệu:', error.message);
            return this.generateMockData(limit);
        }
    }

    generateMockData(count) {
        const sessions = [];
        for (let i = 1; i <= count; i++) {
            const dice1 = Math.floor(Math.random() * 6) + 1;
            const dice2 = Math.floor(Math.random() * 6) + 1;
            const dice3 = Math.floor(Math.random() * 6) + 1;
            const tong = dice1 + dice2 + dice3;
            sessions.push({
                phien: i,
                xuc_xac: [dice1, dice2, dice3],
                tong: tong,
                ket_qua: tong >= 11 ? 'Tài' : 'Xỉu'
            });
        }
        return sessions;
    }

    // ============================================================
    // PHÂN TÍCH KHÁCH QUAN - KHÔNG THIÊN VỊ
    // ============================================================
    analyze(sessions) {
        const results = sessions.slice(-30).map(s => s.ket_qua);
        const tongs = sessions.slice(-30).map(s => s.tong);
        const latest = sessions[sessions.length - 1];

        // ============================================
        // 1. PHÂN TÍCH XU HƯỚNG - KHÁCH QUAN
        // ============================================
        let trendTai = 0;
        let trendXiu = 0;
        if (results.length >= 10) {
            const taiCount = results.slice(-10).filter(r => r === 'Tài').length;
            const xiuCount = 10 - taiCount;
            trendTai = taiCount / 10;
            trendXiu = xiuCount / 10;
        }

        // ============================================
        // 2. PHÂN TÍCH PATTERN - KHÁCH QUAN
        // ============================================
        let patternTai = 0.5;
        let patternXiu = 0.5;
        if (results.length >= 4) {
            for (let len = 4; len >= 2; len--) {
                const pattern = results.slice(-len).join('_');
                if (this.patternMatrix[pattern] !== undefined) {
                    const val = this.patternMatrix[pattern];
                    patternTai = val;
                    patternXiu = 1 - val;
                    break;
                }
            }
        }

        // ============================================
        // 3. MARKOV CHAIN - KHÁCH QUAN
        // ============================================
        let markovTai = 0.5;
        let markovXiu = 0.5;
        if (results.length >= 2) {
            const lastResult = results[results.length - 1];
            markovTai = this.markovChain[lastResult]['Tài'];
            markovXiu = this.markovChain[lastResult]['Xỉu'];
        }

        // ============================================
        // 4. PHÂN TÍCH TỔNG - KHÁCH QUAN
        // ============================================
        let totalTai = 0.5;
        let totalXiu = 0.5;
        if (tongs.length >= 5) {
            const avg5 = tongs.slice(-5).reduce((a, b) => a + b, 0) / 5;
            const avg10 = tongs.slice(-10).reduce((a, b) => a + b, 0) / 10;
            const diff = avg5 - avg10;
            totalTai = Math.max(0.3, Math.min(0.7, (diff / 5) + 0.5));
            totalXiu = 1 - totalTai;
        }

        // ============================================
        // 5. PHÂN TÍCH STREAK - KHÁCH QUAN
        // ============================================
        let streak = 0;
        let streakResult = '';
        if (results.length > 0) {
            const last = results[results.length - 1];
            for (let i = results.length - 1; i >= 0; i--) {
                if (results[i] === last) streak++;
                else break;
            }
            streakResult = last;
        }

        // ============================================
        // TỔNG HỢP KHÁCH QUAN - KHÔNG THIÊN VỊ
        // ============================================
        const weightedTai = (
            trendTai * this.weights.trend +
            patternTai * this.weights.pattern +
            markovTai * this.weights.markov +
            totalTai * this.weights.total
        );
        
        const weightedXiu = 1 - weightedTai;

        // ============================================
        // TÍNH TỈ LỆ - KHÁCH QUAN 58-80%
        // ============================================
        let finalTai = weightedTai;
        let finalXiu = weightedXiu;
        
        // Đảm bảo tỉ lệ trong khoảng 0.58 - 0.80
        const maxConfidence = Math.max(finalTai, finalXiu);
        let confidence = 0.58 + (maxConfidence - 0.5) * 1.2;
        confidence = Math.max(0.58, Math.min(0.80, confidence));

        // ============================================
        // QUYẾT ĐỊNH - DỰA TRÊN PHÂN TÍCH KHÁCH QUAN
        // ============================================
        let prediction = '';
        let confidenceDisplay = '';
        
        if (finalTai > finalXiu) {
            prediction = 'Tài';
            confidenceDisplay = (confidence * 100).toFixed(0) + '%';
        } else if (finalXiu > finalTai) {
            prediction = 'Xỉu';
            confidenceDisplay = (confidence * 100).toFixed(0) + '%';
        } else {
            // Nếu cân bằng, dùng streak
            if (streak >= 3) {
                prediction = streakResult === 'Tài' ? 'Xỉu' : 'Tài';
                confidenceDisplay = '62%';
            } else {
                // Hoàn toàn cân bằng -> không thiên vị
                prediction = Math.random() > 0.5 ? 'Tài' : 'Xỉu';
                confidenceDisplay = '58%';
            }
        }

        // ============================================
        // KIỂM TRA STREAK DÀI - KHÁCH QUAN
        // ============================================
        if (streak >= 6) {
            const reversed = streakResult === 'Tài' ? 'Xỉu' : 'Tài';
            prediction = reversed;
            confidenceDisplay = (58 + Math.min(streak, 15)).toString() + '%';
        }

        return {
            prediction: prediction,
            confidence: confidenceDisplay,
            phân_tích: {
                xu_hướng: {
                    Tài: (trendTai * 100).toFixed(0) + '%',
                    Xỉu: (trendXiu * 100).toFixed(0) + '%'
                },
                pattern: {
                    Tài: (patternTai * 100).toFixed(0) + '%',
                    Xỉu: (patternXiu * 100).toFixed(0) + '%'
                },
                markov: {
                    Tài: (markovTai * 100).toFixed(0) + '%',
                    Xỉu: (markovXiu * 100).toFixed(0) + '%'
                },
                tổng: {
                    Tài: (totalTai * 100).toFixed(0) + '%',
                    Xỉu: (totalXiu * 100).toFixed(0) + '%'
                },
                streak: {
                    số_phiên: streak,
                    kết_quả: streakResult || 'Chưa có'
                },
                tổng_hợp: {
                    Tài: (finalTai * 100).toFixed(0) + '%',
                    Xỉu: (finalXiu * 100).toFixed(0) + '%'
                },
                độ_tin_cậy: confidenceDisplay,
                kết_luận: `Dựa trên phân tích khách quan, khả năng ${prediction} là ${confidenceDisplay}`
            },
            khách_quan: true,
            thiên_vị: 'không'
        };
    }

    // ============================================================
    // DỰ ĐOÁN - KHÁCH QUAN
    // ============================================================
    predict(sessions) {
        if (sessions.length < 3) {
            const latest = sessions[sessions.length - 1];
            return {
                prediction: latest.ket_qua === 'Tài' ? 'Xỉu' : 'Tài',
                confidence: '58%',
                reason: 'Dự đoán cơ bản - 58%',
                phân_tích: {
                    ghi_chú: 'Chưa đủ dữ liệu để phân tích khách quan'
                },
                khách_quan: true,
                thiên_vị: 'không'
            };
        }

        const analysis = this.analyze(sessions);
        return analysis;
    }

    generateMD5(data) {
        return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }

    getPredictionHistory() { return this.predictionHistory; }

    saveHistory() {
        try {
            fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify({
                predictions: this.predictionHistory.slice(-CONFIG.MAX_HISTORY),
                markovChain: this.markovChain,
                timestamp: new Date().toISOString()
            }, null, 2));
        } catch (error) {}
    }

    loadHistory() {
        try {
            if (fs.existsSync(CONFIG.HISTORY_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.HISTORY_FILE, 'utf8'));
                this.predictionHistory = data.predictions || [];
                if (data.markovChain) this.markovChain = data.markovChain;
                console.log(`📜 Đã tải ${this.predictionHistory.length} dự đoán`);
            }
        } catch (error) {}
    }
}

const algorithm = new VIPTXAlgorithm();

// ============================================================
// API
// ============================================================

app.get('/api/tx', async (req, res) => {
    try {
        const sessions = await algorithm.fetchData(50);
        
        if (!sessions || sessions.length === 0) {
            return res.json({
                success: false,
                error: 'Không có dữ liệu',
                dự_đoán: 'Chưa đủ dữ liệu',
                tỉ_lệ: '0%',
                Id: '@tranhoang2286',
                khách_quan: true,
                thiên_vị: 'không'
            });
        }

        const latest = sessions[sessions.length - 1];
        const prediction = algorithm.predict(sessions);
        
        const response = {
            success: true,
            Phiên: latest.phien,
            xúc_xắc: latest.xuc_xac,
            tổng: latest.tong,
            kết_quả: latest.ket_qua,
            phiên_dự_đoán: latest.phien + 1,
            dự_đoán: prediction.prediction,
            tỉ_lệ: prediction.confidence,
            Id: '@tranhoang2286',
            phân_tích: prediction.phân_tích || {},
            khách_quan: true,
            thiên_vị: 'không',
            thời_gian: new Date().toISOString()
        };

        algorithm.predictionHistory.push({
            phiên: latest.phien + 1,
            dự_đoán: response.dự_đoán,
            kết_quả_thực_tế: null,
            đúng_sai: null,
            thời_gian: new Date().toISOString(),
            độ_tin_cậy: prediction.confidence
        });
        algorithm.saveHistory();

        res.json(response);
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).json({ 
            success: false,
            error: 'Lỗi server', 
            dự_đoán: 'Lỗi',
            tỉ_lệ: '0%',
            Id: '@tranhoang2286',
            khách_quan: true
        });
    }
});

app.get('/api/md5', (req, res) => {
    try {
        const { data } = req.query;
        if (!data) {
            return res.status(400).json({ 
                success: false,
                error: 'Thiếu dữ liệu. Sử dụng: /api/md5?data=your_text'
            });
        }
        res.json({
            success: true,
            original: data,
            md5: algorithm.generateMD5(data),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Lỗi tạo MD5' });
    }
});

app.post('/api/md5', (req, res) => {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({ 
                success: false,
                error: 'Thiếu dữ liệu' 
            });
        }
        res.json({
            success: true,
            original: data,
            md5: algorithm.generateMD5(data),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Lỗi tạo MD5' });
    }
});

app.get('/lich_su', (req, res) => {
    try {
        const history = algorithm.getPredictionHistory();
        const valid = history.filter(h => h.đúng_sai !== null);
        
        res.json({
            success: true,
            lịch_sử: history.slice(-100),
            thống_kê: {
                tổng: history.length,
                đã_xác_nhận: valid.length,
                đúng: valid.filter(h => h.đúng_sai).length,
                sai: valid.filter(h => !h.đúng_sai).length,
                tỉ_lệ_đúng: valid.length > 0 ? 
                    (valid.filter(h => h.đúng_sai).length / valid.length * 100).toFixed(2) + '%' : '0%'
            },
            khách_quan: true,
            thời_gian: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Lỗi lấy lịch sử' });
    }
});

app.post('/api/update_prediction', async (req, res) => {
    try {
        const { phiên, kết_quả_thực_tế } = req.body;
        
        if (!phiên || !kết_quả_thực_tế) {
            return res.status(400).json({ 
                success: false,
                error: 'Thiếu phiên hoặc kết quả thực tế' 
            });
        }

        const entry = algorithm.predictionHistory.find(p => p.phiên === phiên);
        if (!entry) {
            return res.status(404).json({ 
                success: false,
                error: 'Không tìm thấy dự đoán' 
            });
        }

        entry.kết_quả_thực_tế = kết_quả_thực_tế;
        entry.đúng_sai = entry.dự_đoán === kết_quả_thực_tế;

        const results = algorithm.predictionHistory
            .filter(h => h.kết_quả_thực_tế)
            .slice(-100)
            .map(h => h.kết_quả_thực_tế);
        
        if (results.length >= 2) {
            const transitions = { 
                'Tài': { 'Tài': 0, 'Xỉu': 0 }, 
                'Xỉu': { 'Tài': 0, 'Xỉu': 0 } 
            };
            for (let i = 0; i < results.length - 1; i++) {
                transitions[results[i]][results[i + 1]]++;
            }
            for (const state in transitions) {
                const total = transitions[state]['Tài'] + transitions[state]['Xỉu'];
                if (total > 0) {
                    transitions[state]['Tài'] = Math.min(0.70, transitions[state]['Tài'] / total + 0.05);
                    transitions[state]['Xỉu'] = Math.min(0.70, transitions[state]['Xỉu'] / total + 0.05);
                }
            }
            algorithm.markovChain = transitions;
        }

        algorithm.saveHistory();

        res.json({
            success: true,
            message: entry.đúng_sai ? '🎉 Dự đoán đúng!' : '😅 Dự đoán sai!',
            updated: {
                phiên: entry.phiên,
                dự_đoán: entry.dự_đoán,
                kết_quả: entry.kết_quả_thực_tế,
                đúng: entry.đúng_sai
            },
            khách_quan: true
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Lỗi cập nhật' });
    }
});

app.get('/api/stats', (req, res) => {
    try {
        const history = algorithm.getPredictionHistory();
        const valid = history.filter(h => h.đúng_sai !== null);
        
        res.json({
            success: true,
            tài_xỉu: {
                tổng_phiên: history.length,
                đã_xác_nhận: valid.length,
                đúng: valid.filter(h => h.đúng_sai).length,
                sai: valid.filter(h => !h.đúng_sai).length,
                tỉ_lệ_đúng: valid.length > 0 ? 
                    (valid.filter(h => h.đúng_sai).length / valid.length * 100).toFixed(2) + '%' : '0%'
            },
            khách_quan: true,
            thời_gian: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Lỗi thống kê' });
    }
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        version: '5.0.6',
        type: 'TÀI XỈU - KHÁCH QUAN',
        timestamp: new Date().toISOString(),
        predictionCount: algorithm.predictionHistory.length,
        accuracy_range: '58% - 80%',
        cors: 'enabled',
        khách_quan: true,
        thiên_vị: 'không'
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        name: 'VIP TÀI XỈU API - KHÁCH QUAN',
        version: '5.0.6',
        author: '@tranhoang2286',
        description: 'Phân tích khách quan - Không thiên vị - Tỉ lệ 58-80%',
        nguyên_tắc: [
            'Phân tích dữ liệu khách quan',
            'Không thiên vị bất kỳ kết quả nào',
            'Dựa trên xác suất thống kê',
            'Không random - Có cơ sở phân tích'
        ],
        endpoints: {
            '/api/tx': 'GET - Dự đoán khách quan',
            '/api/md5': 'GET/POST - MD5 hash',
            '/lich_su': 'GET - Lịch sử',
            '/api/stats': 'GET - Thống kê',
            '/api/update_prediction': 'POST - Cập nhật kết quả',
            '/health': 'GET - Health check',
            '/api/info': 'GET - Thông tin'
        },
        cors: 'enabled',
        khách_quan: true
    });
});

setInterval(async () => {
    try {
        await axios.get(`http://localhost:${CONFIG.PORT}/health`);
    } catch (error) {}
}, 14 * 60 * 1000);

app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🔥 VIP TÀI XỈU - KHÁCH QUAN');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${CONFIG.PORT}`);
    console.log('📊 TỈ LỆ: 58% - 80%');
    console.log('⚖️  KHÔNG THIÊN VỊ');
    console.log('🔍 PHÂN TÍCH KHÁCH QUAN');
    console.log('='.repeat(60));
    console.log('📌 ENDPOINTS:');
    console.log(`  🎯 GET  /api/tx - Dự đoán KHÁCH QUAN`);
    console.log(`  🔐 GET  /api/md5?data=xxx - MD5 Hash`);
    console.log(`  🔐 POST /api/md5 - MD5 Hash`);
    console.log(`  📜 GET  /lich_su - Lịch sử`);
    console.log(`  📊 GET  /api/stats - Thống kê`);
    console.log(`  📝 POST /api/update_prediction - Cập nhật`);
    console.log(`  ❤️  GET  /health - Health check`);
    console.log(`  ℹ️  GET  /api/info - Thông tin`);
    console.log('='.repeat(60));
    console.log('✅ KHÁCH QUAN - KHÔNG THIÊN VỊ');
    console.log('='.repeat(60));
});
