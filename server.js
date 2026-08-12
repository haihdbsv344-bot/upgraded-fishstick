// server.js - VIP TX Analysis Algorithm - Cực mạnh, cực VIP

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Cấu hình
const CONFIG = {
    API_URL: 'https://wtx.macminim6.online/v1/tx/sessions',
    PORT: process.env.PORT || 3000,
    HISTORY_FILE: 'prediction_history.json',
    MAX_HISTORY: 1000,
    LEARNING_RATE: 0.01,
    MOMENTUM: 0.9,
    WINDOW_SIZE: 20,
    PATTERN_DEPTH: 10,
    CONFIDENCE_THRESHOLD: 0.75
};

// Lớp thuật toán VIP cực mạnh
class VIPTXAlgorithm {
    constructor() {
        this.history = [];
        this.predictionHistory = [];
        this.patterns = {};
        this.weights = {};
        this.biases = {};
        this.velocity = {};
        this.learningRate = CONFIG.LEARNING_RATE;
        this.momentum = CONFIG.MOMENTUM;
        this.hiddenLayers = [64, 128, 256, 128, 64];
        this.initializeWeights();
        this.loadHistory();
    }

    initializeWeights() {
        const layers = [6, ...this.hiddenLayers, 2];
        
        for (let i = 0; i < layers.length - 1; i++) {
            const scale = Math.sqrt(2.0 / layers[i]);
            this.weights[`W${i}`] = Array.from({length: layers[i]}, () => 
                Array.from({length: layers[i+1]}, () => (Math.random() * 2 - 1) * scale)
            );
            this.biases[`b${i}`] = Array.from({length: layers[i+1]}, () => (Math.random() * 2 - 1) * 0.1);
            this.velocity[`W${i}`] = Array.from({length: layers[i]}, () => 
                Array.from({length: layers[i+1]}, () => 0)
            );
            this.velocity[`b${i}`] = Array.from({length: layers[i+1]}, () => 0);
        }
    }

    relu(x) {
        return Math.max(0, x);
    }

    softmax(x) {
        const max = Math.max(...x);
        const exp = x.map(v => Math.exp(v - max));
        const sum = exp.reduce((a, b) => a + b, 0);
        return exp.map(v => v / sum);
    }

    forwardPass(input) {
        let current = input;
        const activations = [current];
        
        for (let i = 0; i < Object.keys(this.weights).length; i++) {
            const w = this.weights[`W${i}`];
            const b = this.biases[`b${i}`];
            
            let next = Array(w[0].length).fill(0);
            for (let j = 0; j < current.length; j++) {
                for (let k = 0; k < w[0].length; k++) {
                    next[k] += current[j] * w[j][k];
                }
            }
            
            for (let k = 0; k < next.length; k++) {
                next[k] += b[k];
                if (i < Object.keys(this.weights).length - 1) {
                    next[k] = this.relu(next[k]);
                }
            }
            
            current = next;
            activations.push(current);
        }
        
        return this.softmax(current);
    }

    extractFeatures(sessions) {
        if (sessions.length < 2) return null;
        
        const latest = sessions[sessions.length - 1];
        const prev = sessions[sessions.length - 2];
        
        const features = [];
        
        // 1. Tổng hiện tại (chuẩn hóa)
        features.push(latest.tong / 18);
        
        // 2. Chênh lệch tổng
        features.push((latest.tong - prev.tong) / 18);
        
        // 3. Trung bình tổng trong 10 phiên
        const avg10 = sessions.slice(-10).reduce((sum, s) => sum + s.tong, 0) / Math.min(10, sessions.length);
        features.push(avg10 / 18);
        
        // 4. Tỷ lệ Tài/Xỉu gần đây
        const recentResults = sessions.slice(-20).map(s => s.ket_qua);
        const taiCount = recentResults.filter(r => r === 'Tài').length;
        features.push(taiCount / recentResults.length);
        
        // 5. Biến động
        const tongs = sessions.slice(-10).map(s => s.tong);
        const mean = tongs.reduce((a, b) => a + b, 0) / tongs.length;
        const variance = tongs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / tongs.length;
        features.push(Math.sqrt(variance) / 18);
        
        // 6. Phân tích pattern của xúc xắc
        const dicePattern = this.analyzeDicePattern(sessions);
        features.push(dicePattern);
        
        return features;
    }

    analyzeDicePattern(sessions) {
        if (sessions.length < 3) return 0.5;
        
        const last = sessions[sessions.length - 1];
        const patterns = [];
        
        for (let i = 0; i < 3; i++) {
            const values = sessions.slice(-10).map(s => s.xuc_xac[i]);
            const lastValue = last.xuc_xac[i];
            
            let patternFound = false;
            for (let j = 1; j < 6; j++) {
                const pattern = values.slice(-j);
                const matches = [];
                for (let k = 0; k < values.length - j; k++) {
                    if (values.slice(k, k + j).join(',') === pattern.join(',')) {
                        matches.push(k);
                    }
                }
                if (matches.length >= 2) {
                    const nextValue = values[matches[matches.length - 1] + j];
                    if (nextValue === lastValue) {
                        patternFound = true;
                        break;
                    }
                }
            }
            
            patterns.push(patternFound ? 1 : 0);
        }
        
        return patterns.reduce((a, b) => a + b, 0) / 3;
    }

    predict(sessions) {
        if (sessions.length < 5) {
            return { prediction: 'Chờ', confidence: 0, reason: 'Không đủ dữ liệu' };
        }

        const features = this.extractFeatures(sessions);
        if (!features) {
            return { prediction: 'Chờ', confidence: 0, reason: 'Không thể trích xuất đặc trưng' };
        }

        const prediction = this.forwardPass(features);
        const taiConfidence = prediction[0];
        const xiuConfidence = prediction[1];
        
        const maxConfidence = Math.max(taiConfidence, xiuConfidence);
        const result = taiConfidence > xiuConfidence ? 'Tài' : 'Xỉu';
        
        const additionalFactors = this.analyzeAdditionalFactors(sessions);
        
        let finalConfidence = maxConfidence;
        let finalResult = result;
        
        if (additionalFactors.patternStrength > 0.7) {
            finalConfidence *= 1.2;
        }
        
        if (additionalFactors.reversalProbability > 0.6) {
            finalResult = result === 'Tài' ? 'Xỉu' : 'Tài';
            finalConfidence *= 0.8;
        }
        
        finalConfidence = Math.min(finalConfidence, 1.0);
        
        if (finalConfidence < CONFIG.CONFIDENCE_THRESHOLD) {
            return {
                prediction: 'Chờ',
                confidence: finalConfidence,
                reason: `Độ tin cậy thấp: ${(finalConfidence * 100).toFixed(1)}%`
            };
        }

        return {
            prediction: finalResult,
            confidence: finalConfidence,
            reason: `Độ tin cậy: ${(finalConfidence * 100).toFixed(1)}%`
        };
    }

    analyzeAdditionalFactors(sessions) {
        const recent = sessions.slice(-20);
        const results = recent.map(s => s.ket_qua);
        
        let patternStrength = 0;
        for (let i = 1; i < 5; i++) {
            const patterns = results.slice(-i);
            const matches = [];
            for (let j = 0; j < results.length - i; j++) {
                if (results.slice(j, j + i).join(',') === patterns.join(',')) {
                    matches.push(j);
                }
            }
            if (matches.length >= 2) {
                patternStrength = matches.length / 5;
                break;
            }
        }
        
        const lastResults = results.slice(-10);
        const taiCount = lastResults.filter(r => r === 'Tài').length;
        const reversalProbability = Math.abs(taiCount / lastResults.length - 0.5) * 2;
        
        return {
            patternStrength,
            reversalProbability
        };
    }

    trainModel(sessions, actualResult) {
        const features = this.extractFeatures(sessions);
        if (!features) return;
        
        const target = actualResult === 'Tài' ? [1, 0] : [0, 1];
        const prediction = this.forwardPass(features);
        
        let error = prediction.map((p, i) => p - target[i]);
        
        for (let i = Object.keys(this.weights).length - 1; i >= 0; i--) {
            const w = this.weights[`W${i}`];
            const b = this.biases[`b${i}`];
            const prevError = error;
            
            for (let j = 0; j < b.length; j++) {
                this.velocity[`b${i}`][j] = this.momentum * this.velocity[`b${i}`][j] - this.learningRate * prevError[j];
                b[j] += this.velocity[`b${i}`][j];
            }
            
            for (let j = 0; j < w.length; j++) {
                for (let k = 0; k < w[0].length; k++) {
                    const grad = prevError[k];
                    this.velocity[`W${i}`][j][k] = this.momentum * this.velocity[`W${i}`][j][k] - this.learningRate * grad;
                    w[j][k] += this.velocity[`W${i}`][j][k];
                }
            }
            
            if (i > 0) {
                const prevW = this.weights[`W${i-1}`];
                error = Array(prevW.length).fill(0);
                for (let j = 0; j < prevW.length; j++) {
                    for (let k = 0; k < prevW[0].length; k++) {
                        error[j] += prevError[k] * prevW[j][k];
                    }
                    error[j] *= features[j] > 0 ? 1 : 0.01;
                }
            }
        }
    }

    getPredictionHistory() {
        return this.predictionHistory;
    }

    saveHistory() {
        try {
            const data = {
                predictions: this.predictionHistory.slice(-CONFIG.MAX_HISTORY),
                timestamp: new Date().toISOString()
            };
            fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Lỗi lưu lịch sử:', error);
        }
    }

    loadHistory() {
        try {
            if (fs.existsSync(CONFIG.HISTORY_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.HISTORY_FILE, 'utf8'));
                this.predictionHistory = data.predictions || [];
                console.log(`Đã tải ${this.predictionHistory.length} dự đoán lịch sử`);
            }
        } catch (error) {
            console.error('Lỗi tải lịch sử:', error);
        }
    }

    async fetchData(limit = 100) {
        try {
            const response = await axios.get(`${CONFIG.API_URL}?limit=${limit}`);
            return response.data.sessions || [];
        } catch (error) {
            console.error('Lỗi lấy dữ liệu:', error);
            return [];
        }
    }

    generateMD5(data) {
        return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }
}

// Khởi tạo thuật toán
const algorithm = new VIPTXAlgorithm();

// ==================== API ENDPOINTS ====================

// API chính - Dự đoán
app.get('/api/tx', async (req, res) => {
    try {
        const sessions = await algorithm.fetchData(50);
        
        if (!sessions || sessions.length < 5) {
            return res.status(400).json({
                error: 'Không đủ dữ liệu để phân tích',
                required: 5,
                current: sessions ? sessions.length : 0
            });
        }

        const latestSession = sessions[sessions.length - 1];
        const nextSessionNumber = latestSession.phien + 1;

        const prediction = algorithm.predict(sessions);
        
        const response = {
            Phiên: latestSession.phien,
            xúc_xắc: latestSession.xuc_xac,
            tổng: latestSession.tong,
            kết_quả: latestSession.ket_qua,
            phiên_dự_đoán: nextSessionNumber,
            dự_đoán: prediction.prediction,
            tỉ_lệ: prediction.confidence,
            Id: '@tranhoang2286',
            phân_tích: {
                chi_tiết: prediction.reason,
                thời_gian: new Date().toISOString(),
                độ_tin_cậy: `${(prediction.confidence * 100).toFixed(1)}%`
            }
        };

        const historyEntry = {
            phiên: nextSessionNumber,
            dự_đoán: prediction.prediction,
            kết_quả_thực_tế: null,
            đúng_sai: null,
            thời_gian: new Date().toISOString(),
            độ_tin_cậy: prediction.confidence
        };
        algorithm.predictionHistory.push(historyEntry);
        algorithm.saveHistory();

        res.json(response);
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).json({ error: 'Lỗi server', details: error.message });
    }
});

// API lấy lịch sử dự đoán
app.get('/lich_su', (req, res) => {
    try {
        const history = algorithm.getPredictionHistory();
        const stats = {
            tổng: history.length,
            đúng: history.filter(h => h.đúng_sai === true).length,
            sai: history.filter(h => h.đúng_sai === false).length,
            chờ: history.filter(h => h.đúng_sai === null).length,
            tỉ_lệ_đúng: history.filter(h => h.đúng_sai === true).length / 
                         (history.filter(h => h.đúng_sai !== null).length || 1)
        };

        res.json({
            lịch_sử: history.slice(-100),
            thống_kê: stats,
            thời_gian: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy lịch sử' });
    }
});

// API MD5 hash
app.post('/api/md5', (req, res) => {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({ error: 'Thiếu dữ liệu' });
        }
        
        const hash = algorithm.generateMD5(data);
        res.json({
            original: data,
            md5: hash,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi tạo MD5' });
    }
});

// API cập nhật kết quả dự đoán
app.post('/api/update_prediction', async (req, res) => {
    try {
        const { phiên, kết_quả_thực_tế } = req.body;
        
        const entry = algorithm.predictionHistory.find(p => p.phiên === phiên);
        if (entry) {
            entry.kết_quả_thực_tế = kết_quả_thực_tế;
            entry.đúng_sai = entry.dự_đoán === kết_quả_thực_tế;
            
            const sessions = await algorithm.fetchData(100);
            const sessionIndex = sessions.findIndex(s => s.phien === phiên - 1);
            if (sessionIndex >= 0) {
                const relevantSessions = sessions.slice(0, sessionIndex + 1);
                algorithm.trainModel(relevantSessions, kết_quả_thực_tế);
            }
            
            algorithm.saveHistory();
            
            res.json({
                success: true,
                updated: entry,
                message: entry.đúng_sai ? 'Dự đoán đúng!' : 'Dự đoán sai!'
            });
        } else {
            res.status(404).json({ error: 'Không tìm thấy dự đoán' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Lỗi cập nhật' });
    }
});

// API thống kê chi tiết
app.get('/api/stats', (req, res) => {
    try {
        const history = algorithm.getPredictionHistory();
        const valid = history.filter(h => h.đúng_sai !== null);
        
        const stats = {
            tổng_phiên: history.length,
            đã_xác_nhận: valid.length,
            đúng: valid.filter(h => h.đúng_sai).length,
            sai: valid.filter(h => !h.đúng_sai).length,
            tỉ_lệ_đúng: valid.length > 0 ? (valid.filter(h => h.đúng_sai).length / valid.length * 100).toFixed(2) : 0,
            
            phân_tích_độ_tin_cậy: {
                cao: valid.filter(h => h.độ_tin_cậy >= 0.8).length,
                trung_bình: valid.filter(h => h.độ_tin_cậy >= 0.5 && h.độ_tin_cậy < 0.8).length,
                thấp: valid.filter(h => h.độ_tin_cậy < 0.5).length
            },
            
            gần_đây: valid.slice(-10).map(h => ({
                phiên: h.phiên,
                dự_đoán: h.dự_đoán,
                kết_quả: h.kết_quả_thực_tế,
                đúng: h.đúng_sai
            })),
            
            thời_gian: new Date().toISOString()
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi thống kê' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        predictionCount: algorithm.predictionHistory.length
    });
});

// Keep alive cho Render
setInterval(async () => {
    try {
        await axios.get(`http://localhost:${CONFIG.PORT}/health`);
        console.log('🔄 Keep-alive ping thành công');
    } catch (error) {
        console.log('⚠️ Keep-alive ping thất bại');
    }
}, 14 * 60 * 1000);

// Khởi động server
app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`🚀 VIP TX Analysis Server đang chạy tại port ${CONFIG.PORT}`);
    console.log(`📊 Health Check: http://localhost:${CONFIG.PORT}/health`);
    console.log(`🎯 Dự đoán: GET /api/tx`);
    console.log(`📜 Lịch sử: GET /lich_su`);
    console.log(`🔐 MD5: POST /api/md5`);
    console.log(`📈 Thống kê: GET /api/stats`);
});
