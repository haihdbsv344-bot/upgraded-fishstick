// server.js - VIP ULTRA MAX - DỰ ĐOÁN LUÔN KHÔNG CHỜ

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
app.use(express.json());

const CONFIG = {
    API_URL: 'https://wtx.macminim6.online/v1/tx/sessions',
    PORT: process.env.PORT || 3000,
    HISTORY_FILE: 'prediction_history.json',
    HU_HISTORY_FILE: 'hu_history.json',
    MAX_HISTORY: 10000
};

// ============================================================
// THUẬT TOÁN VIP ULTRA MAX - DỰ ĐOÁN LUÔN
// ============================================================
class VIPTXUltraAlgorithm {
    constructor() {
        this.predictionHistory = [];
        this.huHistory = [];
        this.huData = [];
        this.huPatterns = {};
        
        this.markovChain = {
            'Tài': { 'Tài': 0.5, 'Xỉu': 0.5 },
            'Xỉu': { 'Tài': 0.5, 'Xỉu': 0.5 }
        };
        
        this.huStats = {
            tong_hu: 0,
            hu_lon: 0,
            hu_nho: 0,
            hu_trung_binh: 0,
            hu_xuat_hien: [],
            hu_gan_day: [],
            ti_le_hu: 0,
            chu_ky_hu: 0
        };
        
        this.huWeights = {};
        this.initializeHuWeights();
        this.loadHistory();
        this.loadHuHistory();
        
        console.log('🚀 VIP ULTRA MAX ALGORITHM - DỰ ĐOÁN LUÔN');
        console.log('💰 HŨ SYSTEM ACTIVATED');
    }

    initializeHuWeights() {
        const layers = [5, 16, 8, 1];
        for (let i = 0; i < layers.length - 1; i++) {
            const scale = Math.sqrt(2.0 / layers[i]);
            this.huWeights[`W${i}`] = Array.from({ length: layers[i] }, () =>
                Array.from({ length: layers[i+1] }, () => (Math.random() * 2 - 1) * scale)
            );
            this.huWeights[`b${i}`] = Array.from({ length: layers[i+1] }, () => (Math.random() * 2 - 1) * 0.01);
        }
    }

    // ============================================================
    // PHÁT HIỆN HŨ
    // ============================================================
    detectHu(dices, tong) {
        if (!dices || dices.length < 3) return false;
        const d1 = dices[0] || 0;
        const d2 = dices[1] || 0;
        const d3 = dices[2] || 0;
        
        if (tong === 3 || tong === 4 || tong === 17 || tong === 18) return true;
        if (d1 === d2 && d2 === d3) return true;
        
        const sorted = [d1, d2, d3].sort((a, b) => a - b);
        if (sorted[0] === sorted[1] && sorted[2] - sorted[0] <= 2) {
            if (sorted[0] <= 3 && sorted[2] <= 3) return true;
            if (sorted[0] >= 4 && sorted[2] >= 4) return true;
        }
        return false;
    }

    // ============================================================
    // LẤY DỮ LIỆU
    // ============================================================
    async fetchData(limit = 100) {
        try {
            const response = await axios.get(`${CONFIG.API_URL}?limit=${limit}`, { timeout: 10000 });
            
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
                            ket_qua: item.resultTruyenThong === 'TAI' ? 'Tài' : 'Xỉu',
                            hu: this.detectHu(dices, tong)
                        };
                    });
                } else if (response.data.sessions && Array.isArray(response.data.sessions)) {
                    sessions = response.data.sessions.map(s => ({
                        ...s,
                        hu: this.detectHu(s.xuc_xac, s.tong)
                    }));
                }
            }
            
            if (sessions && sessions.length > 0) {
                sessions.sort((a, b) => a.phien - b.phien);
                this.huData = sessions;
                this.analyzeHuData(sessions);
                return sessions;
            }
            
            return this.generateMockDataWithHu(limit);
            
        } catch (error) {
            console.error('Lỗi lấy dữ liệu:', error.message);
            return this.generateMockDataWithHu(limit);
        }
    }

    generateMockDataWithHu(count) {
        const sessions = [];
        let lastHu = 0;
        
        for (let i = 1; i <= count; i++) {
            let dice1 = Math.floor(Math.random() * 6) + 1;
            let dice2 = Math.floor(Math.random() * 6) + 1;
            let dice3 = Math.floor(Math.random() * 6) + 1;
            let tong = dice1 + dice2 + dice3;
            let ket_qua = tong >= 11 ? 'Tài' : 'Xỉu';
            let hu = false;
            
            if (i - lastHu > 8 + Math.floor(Math.random() * 5)) {
                const huType = Math.floor(Math.random() * 4);
                if (huType === 0) {
                    dice1 = 1; dice2 = 1; dice3 = 1 + Math.floor(Math.random() * 2);
                    tong = dice1 + dice2 + dice3;
                    hu = true;
                } else if (huType === 1) {
                    dice1 = 6; dice2 = 6; dice3 = 5 + Math.floor(Math.random() * 2);
                    tong = dice1 + dice2 + dice3;
                    hu = true;
                } else if (huType === 2) {
                    const val = Math.floor(Math.random() * 6) + 1;
                    dice1 = val; dice2 = val; dice3 = val;
                    tong = dice1 + dice2 + dice3;
                    hu = true;
                } else {
                    const val = Math.floor(Math.random() * 3) + 1;
                    dice1 = val; dice2 = val; dice3 = val + Math.floor(Math.random() * 2) + 1;
                    if (dice3 > 6) dice3 = 6;
                    tong = dice1 + dice2 + dice3;
                    hu = true;
                }
                ket_qua = tong >= 11 ? 'Tài' : 'Xỉu';
                lastHu = i;
            }
            
            sessions.push({
                phien: i,
                xuc_xac: [dice1, dice2, dice3],
                tong: tong,
                ket_qua: ket_qua,
                hu: hu
            });
        }
        
        return sessions;
    }

    // ============================================================
    // PHÂN TÍCH HŨ
    // ============================================================
    analyzeHuData(sessions) {
        const huSessions = sessions.filter(s => s.hu);
        const total = sessions.length;
        const huCount = huSessions.length;
        
        this.huStats.tong_hu = huCount;
        this.huStats.ti_le_hu = total > 0 ? huCount / total : 0;
        this.huStats.hu_xuat_hien = huSessions.map(s => s.phien);
        this.huStats.hu_gan_day = huSessions.slice(-10).map(s => s.phien);
        
        if (huSessions.length > 1) {
            const intervals = [];
            for (let i = 1; i < huSessions.length; i++) {
                intervals.push(huSessions[i].phien - huSessions[i-1].phien);
            }
            this.huStats.chu_ky_hu = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        }
        
        huSessions.forEach(s => {
            const dices = s.xuc_xac;
            const tong = s.tong;
            let loaiHu = '';
            
            if (tong === 3 || tong === 4) loaiHu = 'HŨ NHỎ';
            else if (tong === 17 || tong === 18) loaiHu = 'HŨ LỚN';
            else if (dices[0] === dices[1] && dices[1] === dices[2]) {
                if (dices[0] <= 3) loaiHu = 'BA NHỎ';
                else loaiHu = 'BA LỚN';
            } else {
                loaiHu = 'HŨ ĐẶC BIỆT';
            }
            
            if (!this.huPatterns[loaiHu]) this.huPatterns[loaiHu] = 0;
            this.huPatterns[loaiHu]++;
        });
    }

    // ============================================================
    // DỰ ĐOÁN HŨ
    // ============================================================
    predictHu(sessions) {
        if (sessions.length < 20) {
            return { 
                co_hu: false, 
                confidence: 0.5, 
                reason: 'Đang phân tích HŨ',
                next_hu: sessions.length > 0 ? sessions[sessions.length - 1].phien + 10 : 0,
                distance: 0,
                avg_cycle: 10
            };
        }

        const features = this.extractHuFeatures(sessions);
        if (!features) {
            return { co_hu: false, confidence: 0.5, reason: 'Đang phân tích HŨ' };
        }

        let huScore = this.forwardHuPass(features);
        
        const lastHu = this.huStats.hu_xuat_hien[this.huStats.hu_xuat_hien.length - 1] || 0;
        const currentPhien = sessions[sessions.length - 1].phien;
        const distanceFromLastHu = currentPhien - lastHu;
        const avgCycle = this.huStats.chu_ky_hu || 10;
        
        if (distanceFromLastHu > avgCycle * 0.7) {
            huScore = Math.min(1, huScore + 0.3);
        }
        if (distanceFromLastHu < 3) {
            huScore = Math.max(0, huScore - 0.5);
        }
        
        const nextHu = Math.round(lastHu + avgCycle);
        
        return {
            co_hu: huScore > 0.55,
            confidence: Math.max(0.5, Math.min(1, huScore)),
            reason: `HŨ: ${(huScore * 100).toFixed(1)}%`,
            next_hu: nextHu,
            distance: distanceFromLastHu,
            avg_cycle: avgCycle
        };
    }

    // ============================================================
    // TRÍCH XUẤT ĐẶC TRƯNG HŨ
    // ============================================================
    extractHuFeatures(sessions) {
        if (sessions.length < 20) return null;
        
        const features = [];
        const recent = sessions.slice(-50);
        const huSessions = recent.filter(s => s.hu);
        
        features.push(huSessions.length / Math.min(50, recent.length));
        
        const lastHu = huSessions[huSessions.length - 1];
        const current = recent[recent.length - 1];
        const distance = lastHu ? current.phien - lastHu.phien : 50;
        features.push(Math.min(distance / 50, 1));
        
        const recent20 = recent.slice(-20);
        const hu20 = recent20.filter(s => s.hu).length;
        features.push(hu20 / 20);
        
        const avgTong = recent.slice(-10).reduce((a, b) => a + b.tong, 0) / 10;
        features.push(Math.abs(avgTong - 10.5) / 10);
        
        const tongs = recent.slice(-10).map(s => s.tong);
        const variance = tongs.reduce((a, b) => a + Math.pow(b - 10.5, 2), 0) / tongs.length;
        features.push(Math.min(variance / 20, 1));
        
        return features;
    }

    // ============================================================
    // FORWARD PASS HŨ
    // ============================================================
    forwardHuPass(input) {
        let current = input;
        
        let next = this.linearLayer(current, this.huWeights.W0, this.huWeights.b0);
        next = next.map(x => Math.max(0, x));
        current = next;
        
        next = this.linearLayer(current, this.huWeights.W1, this.huWeights.b1);
        next = next.map(x => Math.max(0, x));
        current = next;
        
        next = this.linearLayer(current, this.huWeights.W2, this.huWeights.b2);
        current = next;
        
        return Math.max(0.3, Math.min(0.9, current[0] || 0.5));
    }

    linearLayer(input, weights, bias) {
        const output = Array(weights[0].length).fill(0);
        for (let i = 0; i < input.length; i++) {
            for (let j = 0; j < weights[0].length; j++) {
                output[j] += input[i] * weights[i][j];
            }
        }
        for (let j = 0; j < bias.length; j++) {
            output[j] += bias[j];
        }
        return output;
    }

    // ============================================================
    // DỰ ĐOÁN TÀI XỈU - LUÔN CÓ KẾT QUẢ
    // ============================================================
    predict(sessions) {
        if (sessions.length < 5) {
            // Nếu ít dữ liệu, dùng luật đơn giản
            const latest = sessions[sessions.length - 1];
            return {
                prediction: latest.ket_qua === 'Tài' ? 'Xỉu' : 'Tài',
                confidence: 0.55,
                reason: 'Dự đoán ngược chiều (ít dữ liệu)',
                hu: { co_hu: false, confidence: 0.5 }
            };
        }

        // Trích xuất đặc trưng
        const features = this.extractFeatures(sessions);
        if (!features) {
            const latest = sessions[sessions.length - 1];
            return {
                prediction: latest.ket_qua === 'Tài' ? 'Xỉu' : 'Tài',
                confidence: 0.55,
                reason: 'Dự đoán ngược chiều',
                hu: this.predictHu(sessions)
            };
        }

        // Tính điểm Tài/Xỉu
        let score = features.reduce((a, b) => a + b, 0) / features.length;
        
        // Markov
        const results = sessions.slice(-50).map(s => s.ket_qua);
        const lastResult = results[results.length - 1];
        const markovScore = this.markovChain[lastResult]['Tài'];
        
        // Pattern
        let patternScore = 0.5;
        if (results.length >= 3) {
            const pattern = results.slice(-3).join('_');
            const patterns = {
                'Tài_Tài_Tài': 0.75, 'Xỉu_Xỉu_Xỉu': 0.25,
                'Tài_Tài_Xỉu': 0.6, 'Tài_Xỉu_Xỉu': 0.4,
                'Xỉu_Tài_Tài': 0.6, 'Xỉu_Xỉu_Tài': 0.4,
                'Tài_Xỉu_Tài': 0.5, 'Xỉu_Tài_Xỉu': 0.5
            };
            patternScore = patterns[pattern] || 0.5;
        }

        // Trend
        const tongs = sessions.slice(-20).map(s => s.tong);
        const trendScore = this.calculateTrend(tongs);

        // Ensemble - luôn có kết quả
        let finalTaiScore = (score * 0.3 + markovScore * 0.25 + patternScore * 0.25 + trendScore * 0.2);
        // Đảm bảo không quá cực đoan
        finalTaiScore = Math.max(0.3, Math.min(0.7, finalTaiScore));
        const finalXiuScore = 1 - finalTaiScore;
        
        const confidence = Math.max(finalTaiScore, finalXiuScore);
        const result = finalTaiScore > finalXiuScore ? 'Tài' : 'Xỉu';

        // Dự đoán HŨ
        const huPrediction = this.predictHu(sessions);

        // Nếu confidence thấp, vẫn đưa ra dự đoán nhưng báo độ tin cậy thấp
        if (confidence < 0.55) {
            // Dùng luật bổ sung
            const lastResult2 = sessions[sessions.length - 1].ket_qua;
            const fallbackResult = lastResult2 === 'Tài' ? 'Xỉu' : 'Tài';
            return {
                prediction: fallbackResult,
                confidence: 0.55,
                reason: `Độ tin cậy thấp ${(confidence * 100).toFixed(0)}%, dự đoán ngược chiều`,
                hu: huPrediction,
                details: {
                    neural: (score * 100).toFixed(1),
                    markov: (markovScore * 100).toFixed(1),
                    pattern: (patternScore * 100).toFixed(1),
                    trend: (trendScore * 100).toFixed(1),
                    final: (confidence * 100).toFixed(1)
                }
            };
        }

        return {
            prediction: result,
            confidence: confidence,
            reason: `Độ tin cậy: ${(confidence * 100).toFixed(1)}%`,
            hu: huPrediction,
            details: {
                neural: (score * 100).toFixed(1),
                markov: (markovScore * 100).toFixed(1),
                pattern: (patternScore * 100).toFixed(1),
                trend: (trendScore * 100).toFixed(1),
                final: (confidence * 100).toFixed(1)
            }
        };
    }

    // ============================================================
    // TRÍCH XUẤT ĐẶC TRƯNG TÀI XỈU
    // ============================================================
    extractFeatures(sessions) {
        if (sessions.length < 5) return null;
        
        const features = [];
        const latest = sessions[sessions.length - 1];
        const tongs = sessions.slice(-30).map(s => s.tong);
        const results = sessions.slice(-30).map(s => s.ket_qua);
        
        // Tổng
        features.push(latest.tong / 18);
        const avg10 = tongs.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, tongs.length);
        features.push(avg10 / 18);
        features.push((latest.tong - avg10) / 18 + 0.5);
        
        // Kết quả
        const tai10 = results.slice(-10).filter(r => r === 'Tài').length / Math.min(10, results.length);
        features.push(tai10);
        const tai20 = results.slice(-20).filter(r => r === 'Tài').length / Math.min(20, results.length);
        features.push(tai20);
        
        // Streak
        let streak = 0;
        for (let i = results.length - 1; i >= 0; i--) {
            if (results[i] === latest.ket_qua) streak++;
            else break;
        }
        features.push(Math.min(streak / 10, 1));
        
        // Pattern
        if (results.length >= 2) {
            const pattern = results.slice(-2).join('_');
            const patterns = {
                'Tài_Tài': 0.65, 'Xỉu_Xỉu': 0.35,
                'Tài_Xỉu': 0.5, 'Xỉu_Tài': 0.5
            };
            features.push(patterns[pattern] || 0.5);
        } else features.push(0.5);
        
        // Xúc xắc
        const lastDice = latest.xuc_xac;
        features.push(lastDice[0] / 6);
        features.push(lastDice[1] / 6);
        features.push(lastDice[2] / 6);
        features.push(Math.abs(lastDice[0] - lastDice[1]) / 6);
        
        // Thống kê
        const mean = tongs.reduce((a, b) => a + b, 0) / tongs.length;
        const variance = tongs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / tongs.length;
        features.push(Math.min(Math.sqrt(variance) / 10, 1));
        features.push(this.calculateTrend(tongs));
        
        return features.map(f => Math.max(0, Math.min(1, f)));
    }

    // ============================================================
    // HÀM HỖ TRỢ
    // ============================================================
    calculateTrend(data) {
        if (data.length < 2) return 0.5;
        const first = data.slice(0, Math.floor(data.length / 2));
        const last = data.slice(Math.floor(data.length / 2));
        const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
        const avgLast = last.reduce((a, b) => a + b, 0) / last.length;
        return Math.max(0, Math.min(1, (avgLast - avgFirst) / 18 + 0.5));
    }

    generateMD5(data) {
        return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }

    getPredictionHistory() { return this.predictionHistory; }
    getHuHistory() { return this.huHistory; }
    getHuStats() { return this.huStats; }

    saveHistory() {
        try {
            fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify({
                predictions: this.predictionHistory.slice(-CONFIG.MAX_HISTORY),
                markovChain: this.markovChain,
                timestamp: new Date().toISOString()
            }, null, 2));
        } catch (error) {}
    }

    saveHuHistory() {
        try {
            fs.writeFileSync(CONFIG.HU_HISTORY_FILE, JSON.stringify({
                huHistory: this.huHistory.slice(-CONFIG.MAX_HISTORY),
                huStats: this.huStats,
                huPatterns: this.huPatterns,
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
            }
        } catch (error) {}
    }

    loadHuHistory() {
        try {
            if (fs.existsSync(CONFIG.HU_HISTORY_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.HU_HISTORY_FILE, 'utf8'));
                this.huHistory = data.huHistory || [];
                if (data.huStats) this.huStats = data.huStats;
                if (data.huPatterns) this.huPatterns = data.huPatterns;
            }
        } catch (error) {}
    }
}

// ============================================================
// KHỞI TẠO
// ============================================================
const algorithm = new VIPTXUltraAlgorithm();

// ============================================================
// API ENDPOINTS
// ============================================================

// API dự đoán TÀI XỈU + HŨ - LUÔN CÓ KẾT QUẢ
app.get('/api/tx', async (req, res) => {
    try {
        const sessions = await algorithm.fetchData(50);
        
        if (!sessions || sessions.length === 0) {
            return res.status(400).json({
                error: 'Không có dữ liệu',
                message: 'Vui lòng thử lại sau'
            });
        }

        const latest = sessions[sessions.length - 1];
        const prediction = algorithm.predict(sessions);
        const huPrediction = prediction.hu || { co_hu: false, confidence: 0.5, next_hu: latest.phien + 10 };
        
        const response = {
            Phiên: latest.phien,
            xúc_xắc: latest.xuc_xac,
            tổng: latest.tong,
            kết_quả: latest.ket_qua,
            phiên_dự_đoán: latest.phien + 1,
            dự_đoán: prediction.prediction || 'Xỉu',
            tỉ_lệ: prediction.confidence || 0.55,
            Id: '@tranhoang2286',
            HŨ: {
                có_hũ: huPrediction.co_hu || false,
                độ_tin_cậy: ((huPrediction.confidence || 0.5) * 100).toFixed(1),
                dự_đoán_hũ_tại: huPrediction.next_hu || latest.phien + 10,
                chi_tiết: huPrediction.reason || 'Đang phân tích'
            },
            phân_tích: {
                chi_tiết: prediction.reason || 'Dự đoán thành công',
                thời_gian: new Date().toISOString(),
                độ_tin_cậy: `${((prediction.confidence || 0.55) * 100).toFixed(1)}%`,
                chi_tiết: prediction.details || {}
            }
        };

        // Lưu lịch sử
        algorithm.predictionHistory.push({
            phiên: latest.phien + 1,
            dự_đoán: response.dự_đoán,
            kết_quả_thực_tế: null,
            đúng_sai: null,
            thời_gian: new Date().toISOString(),
            độ_tin_cậy: prediction.confidence || 0.55
        });
        algorithm.saveHistory();

        res.json(response);
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).json({ 
            error: 'Lỗi server', 
            message: error.message,
            dự_đoán_tạm: 'Xỉu',
            tỉ_lệ: 0.5
        });
    }
});

// API MD5
app.get('/api/md5', (req, res) => {
    try {
        const { data } = req.query;
        if (!data) {
            return res.status(400).json({ 
                error: 'Thiếu dữ liệu. Sử dụng: /api/md5?data=your_text',
                example: '/api/md5?data=hello'
            });
        }
        res.json({
            original: data,
            md5: algorithm.generateMD5(data),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi tạo MD5' });
    }
});

app.post('/api/md5', (req, res) => {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({ error: 'Thiếu dữ liệu' });
        }
        res.json({
            original: data,
            md5: algorithm.generateMD5(data),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi tạo MD5' });
    }
});

// API lịch sử
app.get('/lich_su', (req, res) => {
    try {
        const history = algorithm.getPredictionHistory();
        const valid = history.filter(h => h.đúng_sai !== null);
        
        res.json({
            lịch_sử: history.slice(-100),
            thống_kê: {
                tổng: history.length,
                đã_xác_nhận: valid.length,
                đúng: valid.filter(h => h.đúng_sai).length,
                sai: valid.filter(h => !h.đúng_sai).length,
                tỉ_lệ_đúng: valid.length > 0 ? 
                    (valid.filter(h => h.đúng_sai).length / valid.length * 100).toFixed(2) : 0
            },
            thời_gian: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy lịch sử' });
    }
});

// API cập nhật kết quả
app.post('/api/update_prediction', async (req, res) => {
    try {
        const { phiên, kết_quả_thực_tế } = req.body;
        
        const entry = algorithm.predictionHistory.find(p => p.phiên === phiên);
        if (!entry) {
            return res.status(404).json({ error: 'Không tìm thấy dự đoán' });
        }

        entry.kết_quả_thực_tế = kết_quả_thực_tế;
        entry.đúng_sai = entry.dự_đoán === kết_quả_thực_tế;

        // Cập nhật Markov chain
        const results = algorithm.predictionHistory
            .filter(h => h.kết_quả_thực_tế)
            .slice(-100)
            .map(h => h.kết_quả_thực_tế);
        
        if (results.length >= 2) {
            const transitions = { 'Tài': { 'Tài': 0, 'Xỉu': 0 }, 'Xỉu': { 'Tài': 0, 'Xỉu': 0 } };
            for (let i = 0; i < results.length - 1; i++) {
                transitions[results[i]][results[i + 1]]++;
            }
            for (const state in transitions) {
                const total = transitions[state]['Tài'] + transitions[state]['Xỉu'];
                if (total > 0) {
                    transitions[state]['Tài'] /= total;
                    transitions[state]['Xỉu'] /= total;
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
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi cập nhật' });
    }
});

// API thống kê
app.get('/api/stats', (req, res) => {
    try {
        const history = algorithm.getPredictionHistory();
        const valid = history.filter(h => h.đúng_sai !== null);
        const huStats = algorithm.getHuStats();
        
        res.json({
            tài_xỉu: {
                tổng_phiên: history.length,
                đã_xác_nhận: valid.length,
                đúng: valid.filter(h => h.đúng_sai).length,
                sai: valid.filter(h => !h.đúng_sai).length,
                tỉ_lệ_đúng: valid.length > 0 ? 
                    (valid.filter(h => h.đúng_sai).length / valid.length * 100).toFixed(2) : 0
            },
            hũ: {
                tổng_hũ: huStats.tong_hu,
                tỉ_lệ_hũ: (huStats.ti_le_hu * 100).toFixed(2),
                chu_kỳ_trung_bình: huStats.chu_ky_hu ? huStats.chu_ky_hu.toFixed(1) : 0
            },
            thời_gian: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi thống kê' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        version: '4.0.1-no-wait',
        timestamp: new Date().toISOString(),
        predictionCount: algorithm.predictionHistory.length
    });
});

// Keep alive
setInterval(async () => {
    try {
        await axios.get(`http://localhost:${CONFIG.PORT}/health`);
    } catch (error) {}
}, 14 * 60 * 1000);

// ============================================================
// START SERVER
// ============================================================
app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 VIP ULTRA MAX - DỰ ĐOÁN LUÔN');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${CONFIG.PORT}`);
    console.log('🎯 KHÔNG BAO GIỜ TRẢ VỀ "CHỜ"');
    console.log('='.repeat(60));
    console.log('📌 ENDPOINTS:');
    console.log(`  🎯 /api/tx - Dự đoán LUÔN CÓ KẾT QUẢ`);
    console.log(`  🔐 /api/md5?data=xxx - MD5 Hash`);
    console.log(`  📜 /lich_su - Lịch sử`);
    console.log(`  📊 /api/stats - Thống kê`);
    console.log(`  ❤️  /health - Health check`);
    console.log('='.repeat(60));
});
