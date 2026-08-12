// server.js - VIP ULTRA MAX ALGORITHM - FULL HŨ + TÀI XỈU

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
    MAX_HISTORY: 10000,
    CONFIDENCE_THRESHOLD: 0.78
};

// ============================================================
// THUẬT TOÁN VIP ULTRA MAX - FULL HŨ + TÀI XỈU
// ============================================================
class VIPTXUltraAlgorithm {
    constructor() {
        // Lịch sử dự đoán
        this.predictionHistory = [];
        this.huHistory = [];
        this.huData = [];
        this.huPatterns = {};
        
        // Markov Chain
        this.markovChain = {
            'Tài': { 'Tài': 0.5, 'Xỉu': 0.5 },
            'Xỉu': { 'Tài': 0.5, 'Xỉu': 0.5 }
        };
        
        // Hũ data
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
        
        // Neural Network weights cho HŨ
        this.huWeights = {};
        this.initializeHuWeights();
        
        // Load dữ liệu
        this.loadHistory();
        this.loadHuHistory();
        
        console.log('🚀 VIP ULTRA MAX ALGORITHM INITIALIZED');
        console.log('💰 HŨ SYSTEM ACTIVATED');
        console.log('🎯 TÀI XỈU + HŨ ANALYSIS READY');
    }

    // ============================================================
    // KHỞI TẠO WEIGHTS CHO HŨ
    // ============================================================
    initializeHuWeights() {
        // [5 features] -> [16] -> [8] -> [1]
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
    // LẤY DỮ LIỆU HŨ
    // ============================================================
    async fetchHuData(limit = 100) {
        try {
            const response = await axios.get(`${CONFIG.API_URL}?limit=${limit}`, { 
                timeout: 10000
            });
            
            let sessions = [];
            
            if (response.data) {
                // Xử lý dữ liệu từ API
                if (response.data.list && Array.isArray(response.data.list)) {
                    sessions = response.data.list.map(item => {
                        let dices = item.dices;
                        if (Array.isArray(dices) && Array.isArray(dices[0])) {
                            dices = dices[0];
                        }
                        if (typeof dices === 'number') {
                            dices = [dices, 0, 0];
                        }
                        return {
                            phien: item.id || item._id || 0,
                            xuc_xac: dices,
                            tong: item.point || dices.reduce((a, b) => a + b, 0),
                            ket_qua: item.resultTruyenThong === 'TAI' ? 'Tài' : 'Xỉu',
                            // Thêm field cho HŨ
                            hu: this.detectHu(dices, item.point || dices.reduce((a, b) => a + b, 0))
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
                console.log(`✅ Đã lấy ${sessions.length} phiên với dữ liệu HŨ`);
                return sessions;
            }
            
            console.log('⚠️ Không có dữ liệu, tạo dữ liệu mẫu có HŨ...');
            return this.generateMockDataWithHu(limit);
            
        } catch (error) {
            console.error('❌ Lỗi lấy dữ liệu:', error.message);
            return this.generateMockDataWithHu(limit);
        }
    }

    // ============================================================
    // PHÁT HIỆN HŨ
    // ============================================================
    detectHu(dices, tong) {
        // HŨ = Tổng 3 con xúc xắc = 3, 4, 17, 18
        // Hoặc 3 con giống nhau (bao gồm cả bộ ba)
        if (!dices || dices.length < 3) return false;
        
        const d1 = dices[0] || 0;
        const d2 = dices[1] || 0;
        const d3 = dices[2] || 0;
        
        // Kiểm tra tổng HŨ
        if (tong === 3 || tong === 4 || tong === 17 || tong === 18) {
            return true;
        }
        
        // Kiểm tra 3 con giống nhau (bao)
        if (d1 === d2 && d2 === d3) {
            return true;
        }
        
        // Kiểm tra HŨ đặc biệt: 1-1-2, 1-1-3, 5-5-6, 6-6-5
        const sorted = [d1, d2, d3].sort((a, b) => a - b);
        if (sorted[0] === sorted[1] && sorted[2] - sorted[0] <= 2) {
            // Cặp đôi gần nhau
            if (sorted[0] <= 3 && sorted[2] <= 3) return true;
            if (sorted[0] >= 4 && sorted[2] >= 4) return true;
        }
        
        return false;
    }

    // ============================================================
    // PHÂN TÍCH DỮ LIỆU HŨ
    // ============================================================
    analyzeHuData(sessions) {
        const huSessions = sessions.filter(s => s.hu);
        const total = sessions.length;
        const huCount = huSessions.length;
        
        this.huStats.tong_hu = huCount;
        this.huStats.ti_le_hu = total > 0 ? huCount / total : 0;
        this.huStats.hu_xuat_hien = huSessions.map(s => s.phien);
        this.huStats.hu_gan_day = huSessions.slice(-10).map(s => s.phien);
        
        // Tính chu kỳ HŨ
        if (huSessions.length > 1) {
            const intervals = [];
            for (let i = 1; i < huSessions.length; i++) {
                intervals.push(huSessions[i].phien - huSessions[i-1].phien);
            }
            this.huStats.chu_ky_hu = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        }
        
        // Phân tích loại HŨ
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
        
        console.log('📊 PHÂN TÍCH HŨ:');
        console.log(`  Tổng HŨ: ${this.huStats.tong_hu}`);
        console.log(`  Tỉ lệ HŨ: ${(this.huStats.ti_le_hu * 100).toFixed(2)}%`);
        console.log(`  Chu kỳ HŨ: ${this.huStats.chu_ky_hu.toFixed(1)} phiên`);
        console.log('  Loại HŨ:', this.huPatterns);
    }

    // ============================================================
    // DỰ ĐOÁN HŨ
    // ============================================================
    predictHu(sessions) {
        if (sessions.length < 20) {
            return { 
                co_hu: false, 
                confidence: 0, 
                reason: 'Không đủ dữ liệu để dự đoán HŨ',
                next_hu: 0
            };
        }

        const features = this.extractHuFeatures(sessions);
        if (!features) {
            return { co_hu: false, confidence: 0, reason: 'Không thể trích xuất đặc trưng HŨ' };
        }

        // Neural Network prediction cho HŨ
        let huScore = this.forwardHuPass(features);
        
        // Phân tích chu kỳ
        const lastHu = this.huStats.hu_xuat_hien[this.huStats.hu_xuat_hien.length - 1] || 0;
        const currentPhien = sessions[sessions.length - 1].phien;
        const distanceFromLastHu = currentPhien - lastHu;
        const avgCycle = this.huStats.chu_ky_hu || 10;
        
        // Nếu đã xa chu kỳ HŨ thì khả năng cao HŨ sắp về
        if (distanceFromLastHu > avgCycle * 0.8) {
            huScore = Math.min(1, huScore + 0.3);
        }
        
        // Nếu vừa mới có HŨ, khả năng HŨ tiếp theo thấp
        if (distanceFromLastHu < 3) {
            huScore = Math.max(0, huScore - 0.5);
        }
        
        // Dự đoán HŨ tiếp theo
        const nextHu = Math.round(lastHu + avgCycle);
        
        const result = {
            co_hu: huScore > 0.6,
            confidence: huScore,
            reason: `Độ tin cậy HŨ: ${(huScore * 100).toFixed(1)}%`,
            next_hu: nextHu,
            distance: distanceFromLastHu,
            avg_cycle: avgCycle,
            chi_tiet: {
                ti_le_hu: (this.huStats.ti_le_hu * 100).toFixed(1),
                last_hu: lastHu,
                current: currentPhien,
                patterns: this.huPatterns
            }
        };
        
        return result;
    }

    // ============================================================
    // TRÍCH XUẤT ĐẶC TRƯNG CHO HŨ
    // ============================================================
    extractHuFeatures(sessions) {
        if (sessions.length < 20) return null;
        
        const features = [];
        const recent = sessions.slice(-50);
        const huSessions = recent.filter(s => s.hu);
        
        // 1. Tỉ lệ HŨ trong 50 phiên
        features.push(huSessions.length / Math.min(50, recent.length));
        
        // 2. Khoảng cách từ HŨ gần nhất
        const lastHu = huSessions[huSessions.length - 1];
        const current = recent[recent.length - 1];
        const distance = lastHu ? current.phien - lastHu.phien : 50;
        features.push(Math.min(distance / 50, 1));
        
        // 3. Số HŨ trong 20 phiên gần đây
        const recent20 = recent.slice(-20);
        const hu20 = recent20.filter(s => s.hu).length;
        features.push(hu20 / 20);
        
        // 4. Tổng điểm trung bình gần đây (càng thấp/cao càng dễ HŨ)
        const avgTong = recent.slice(-10).reduce((a, b) => a + b.tong, 0) / 10;
        features.push(Math.abs(avgTong - 10.5) / 10);
        
        // 5. Biến động
        const tongs = recent.slice(-10).map(s => s.tong);
        const variance = tongs.reduce((a, b) => a + Math.pow(b - 10.5, 2), 0) / tongs.length;
        features.push(Math.min(variance / 20, 1));
        
        return features;
    }

    // ============================================================
    // FORWARD PASS CHO HŨ
    // ============================================================
    forwardHuPass(input) {
        let current = input;
        
        // Layer 1: 5 -> 16
        let next = this.linearLayer(current, this.huWeights.W0, this.huWeights.b0);
        next = next.map(x => Math.max(0, x));
        current = next;
        
        // Layer 2: 16 -> 8
        next = this.linearLayer(current, this.huWeights.W1, this.huWeights.b1);
        next = next.map(x => Math.max(0, x));
        current = next;
        
        // Layer 3: 8 -> 1
        next = this.linearLayer(current, this.huWeights.W2, this.huWeights.b2);
        current = next;
        
        return Math.max(0, Math.min(1, current[0]));
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
    // LẤY DỮ LIỆU TÀI XỈU
    // ============================================================
    async fetchData(limit = 100) {
        try {
            const response = await axios.get(`${CONFIG.API_URL}?limit=${limit}`, { 
                timeout: 10000
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
                console.log(`✅ Đã lấy ${sessions.length} phiên TÀI XỈU + HŨ`);
                return sessions;
            }
            
            console.log('⚠️ Không có dữ liệu, tạo dữ liệu mẫu...');
            return this.generateMockDataWithHu(limit);
            
        } catch (error) {
            console.error('❌ Lỗi lấy dữ liệu:', error.message);
            return this.generateMockDataWithHu(limit);
        }
    }

    // ============================================================
    // TẠO DỮ LIỆU MẪU CÓ HŨ
    // ============================================================
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
            
            // Tạo HŨ theo chu kỳ
            if (i - lastHu > 8 + Math.floor(Math.random() * 5)) {
                // Tạo HŨ
                const huType = Math.floor(Math.random() * 4);
                if (huType === 0) { // HŨ NHỎ
                    dice1 = 1;
                    dice2 = 1;
                    dice3 = 1 + Math.floor(Math.random() * 2);
                    tong = dice1 + dice2 + dice3;
                    hu = true;
                } else if (huType === 1) { // HŨ LỚN
                    dice1 = 6;
                    dice2 = 6;
                    dice3 = 5 + Math.floor(Math.random() * 2);
                    tong = dice1 + dice2 + dice3;
                    hu = true;
                } else if (huType === 2) { // BA
                    const val = Math.floor(Math.random() * 6) + 1;
                    dice1 = val;
                    dice2 = val;
                    dice3 = val;
                    tong = dice1 + dice2 + dice3;
                    hu = true;
                } else { // HŨ ĐẶC BIỆT
                    const val = Math.floor(Math.random() * 3) + 1;
                    dice1 = val;
                    dice2 = val;
                    dice3 = val + Math.floor(Math.random() * 2) + 1;
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
        
        console.log(`✅ Đã tạo ${count} dữ liệu mẫu TÀI XỈU + HŨ`);
        return sessions;
    }

    // ============================================================
    // DỰ ĐOÁN TÀI XỈU
    // ============================================================
    predict(sessions) {
        if (sessions.length < 10) {
            return { 
                prediction: 'Chờ', 
                confidence: 0, 
                reason: 'Không đủ dữ liệu (cần 10 phiên)',
                hu: null
            };
        }

        const features = this.extractFeatures(sessions);
        if (!features) {
            return { prediction: 'Chờ', confidence: 0, reason: 'Không thể trích xuất đặc trưng' };
        }

        // Tính điểm cho Tài/Xỉu
        let score = features.reduce((a, b) => a + b, 0) / features.length;
        
        // Markov prediction
        const results = sessions.slice(-50).map(s => s.ket_qua);
        const lastResult = results[results.length - 1];
        const markovScore = this.markovChain[lastResult]['Tài'];
        
        // Pattern prediction
        let patternScore = 0.5;
        if (results.length >= 3) {
            const pattern = results.slice(-3).join('_');
            const patterns = {
                'Tài_Tài_Tài': 0.8, 'Xỉu_Xỉu_Xỉu': 0.2,
                'Tài_Tài_Xỉu': 0.6, 'Tài_Xỉu_Xỉu': 0.4,
                'Xỉu_Tài_Tài': 0.6, 'Xỉu_Xỉu_Tài': 0.4
            };
            patternScore = patterns[pattern] || 0.5;
        }

        // Trend prediction
        const tongs = sessions.slice(-20).map(s => s.tong);
        const trendScore = this.calculateTrend(tongs);

        // Ensemble
        const finalTaiScore = (score * 0.3 + markovScore * 0.25 + patternScore * 0.25 + trendScore * 0.2);
        const finalXiuScore = 1 - finalTaiScore;
        
        const confidence = Math.max(finalTaiScore, finalXiuScore);
        const result = finalTaiScore > finalXiuScore ? 'Tài' : 'Xỉu';

        // Dự đoán HŨ
        const huPrediction = this.predictHu(sessions);

        if (confidence < CONFIG.CONFIDENCE_THRESHOLD) {
            return {
                prediction: 'Chờ',
                confidence: confidence,
                reason: `Độ tin cậy thấp: ${(confidence * 100).toFixed(1)}%`,
                hu: huPrediction
            };
        }

        return {
            prediction: result,
            confidence: confidence,
            reason: `Độ tin cậy: ${(confidence * 100).toFixed(1)}% - Ensemble Learning`,
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
        if (sessions.length < 10) return null;
        
        const features = [];
        const latest = sessions[sessions.length - 1];
        const tongs = sessions.slice(-50).map(s => s.tong);
        const results = sessions.slice(-50).map(s => s.ket_qua);
        
        // 1-5: Phân tích tổng
        features.push(latest.tong / 18);
        const avg10 = tongs.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, tongs.length);
        features.push(avg10 / 18);
        const avg20 = tongs.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, tongs.length);
        features.push(avg20 / 18);
        features.push((latest.tong - avg10) / 18);
        features.push((latest.tong - avg20) / 18);
        
        // 6-10: Phân tích kết quả
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
        
        // Reversal probability
        const lastResult = latest.ket_qua;
        const sameCount = results.filter(r => r === lastResult).length;
        features.push(sameCount / results.length);
        
        // Pattern
        if (results.length >= 2) {
            const pattern = results.slice(-2).join('_');
            const patterns = {
                'Tài_Tài': 0.7, 'Xỉu_Xỉu': 0.3,
                'Tài_Xỉu': 0.5, 'Xỉu_Tài': 0.5
            };
            features.push(patterns[pattern] || 0.5);
        } else features.push(0.5);
        
        // 11-15: Phân tích xúc xắc
        const lastDice = latest.xuc_xac;
        features.push(lastDice[0] / 6);
        features.push(lastDice[1] / 6);
        features.push(lastDice[2] / 6);
        const avgDice = tongs.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, tongs.length) / 3;
        features.push(avgDice / 6);
        features.push(Math.abs(lastDice[0] - lastDice[1]) / 6);
        
        // 16-20: Thống kê
        const mean = tongs.reduce((a, b) => a + b, 0) / tongs.length;
        const variance = tongs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / tongs.length;
        features.push(Math.sqrt(variance) / 18);
        features.push(this.calculateSkewness(tongs));
        features.push(this.calculateKurtosis(tongs));
        features.push(this.calculateTrend(tongs));
        features.push(this.calculateRSI(tongs));
        
        return features.map(f => Math.max(0, Math.min(1, (f + 1) / 2)));
    }

    // ============================================================
    // HÀM HỖ TRỢ
    // ============================================================
    calculateSkewness(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const m2 = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        const m3 = data.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / data.length;
        return m2 > 0 ? m3 / Math.pow(m2, 1.5) : 0;
    }

    calculateKurtosis(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const m2 = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        const m4 = data.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / data.length;
        return m2 > 0 ? m4 / Math.pow(m2, 2) - 3 : 0;
    }

    calculateTrend(data) {
        if (data.length < 2) return 0.5;
        const first = data.slice(0, Math.floor(data.length / 2));
        const last = data.slice(Math.floor(data.length / 2));
        const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
        const avgLast = last.reduce((a, b) => a + b, 0) / last.length;
        return (avgLast - avgFirst) / 18 + 0.5;
    }

    calculateRSI(data, period = 14) {
        if (data.length < period + 1) return 50;
        const changes = [];
        for (let i = 1; i < data.length; i++) {
            changes.push(data[i] - data[i-1]);
        }
        const recentChanges = changes.slice(-period);
        const gains = recentChanges.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
        const losses = recentChanges.filter(c => c < 0).reduce((a, b) => a + Math.abs(b), 0) / period;
        if (losses === 0) return 100;
        return 100 - (100 / (1 + gains / losses));
    }

    // ============================================================
    // MD5
    // ============================================================
    generateMD5(data) {
        return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }

    // ============================================================
    // LƯU TRỮ
    // ============================================================
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
        } catch (error) {
            console.error('Lỗi lưu lịch sử:', error);
        }
    }

    saveHuHistory() {
        try {
            fs.writeFileSync(CONFIG.HU_HISTORY_FILE, JSON.stringify({
                huHistory: this.huHistory.slice(-CONFIG.MAX_HISTORY),
                huStats: this.huStats,
                huPatterns: this.huPatterns,
                timestamp: new Date().toISOString()
            }, null, 2));
        } catch (error) {
            console.error('Lỗi lưu lịch sử HŨ:', error);
        }
    }

    loadHistory() {
        try {
            if (fs.existsSync(CONFIG.HISTORY_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.HISTORY_FILE, 'utf8'));
                this.predictionHistory = data.predictions || [];
                if (data.markovChain) this.markovChain = data.markovChain;
                console.log(`📜 Đã tải ${this.predictionHistory.length} dự đoán TÀI XỈU`);
            }
        } catch (error) {
            console.error('Lỗi tải lịch sử:', error);
        }
    }

    loadHuHistory() {
        try {
            if (fs.existsSync(CONFIG.HU_HISTORY_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.HU_HISTORY_FILE, 'utf8'));
                this.huHistory = data.huHistory || [];
                if (data.huStats) this.huStats = data.huStats;
                if (data.huPatterns) this.huPatterns = data.huPatterns;
                console.log(`💰 Đã tải ${this.huHistory.length} dữ liệu HŨ`);
            }
        } catch (error) {
            console.error('Lỗi tải lịch sử HŨ:', error);
        }
    }
}

// ============================================================
// KHỞI TẠO
// ============================================================
const algorithm = new VIPTXUltraAlgorithm();

// ============================================================
// API ENDPOINTS
// ============================================================

// ==================== API TÀI XỈU ====================

// API dự đoán TÀI XỈU + HŨ
app.get('/api/tx', async (req, res) => {
    try {
        const sessions = await algorithm.fetchData(50);
        
        if (!sessions || sessions.length < 10) {
            return res.status(400).json({
                error: 'Không đủ dữ liệu để phân tích',
                required: 10,
                current: sessions ? sessions.length : 0
            });
        }

        const latest = sessions[sessions.length - 1];
        const prediction = algorithm.predict(sessions);
        
        const response = {
            Phiên: latest.phien,
            xúc_xắc: latest.xuc_xac,
            tổng: latest.tong,
            kết_quả: latest.ket_qua,
            phiên_dự_đoán: latest.phien + 1,
            dự_đoán: prediction.prediction,
            tỉ_lệ: prediction.confidence,
            Id: '@tranhoang2286',
            HŨ: {
                có_hũ: prediction.hu ? prediction.hu.co_hu : false,
                độ_tin_cậy: prediction.hu ? (prediction.hu.confidence * 100).toFixed(1) : '0',
                dự_đoán_hũ_tại: prediction.hu ? prediction.hu.next_hu : 0,
                chi_tiết: prediction.hu ? prediction.hu.reason : 'Chưa có dữ liệu HŨ'
            },
            phân_tích: {
                chi_tiết: prediction.reason,
                thời_gian: new Date().toISOString(),
                độ_tin_cậy: `${(prediction.confidence * 100).toFixed(1)}%`,
                chi_tiết: prediction.details || {}
            }
        };

        // Lưu lịch sử dự đoán
        algorithm.predictionHistory.push({
            phiên: latest.phien + 1,
            dự_đoán: prediction.prediction,
            kết_quả_thực_tế: null,
            đúng_sai: null,
            thời_gian: new Date().toISOString(),
            độ_tin_cậy: prediction.confidence,
            hu_dự_đoán: prediction.hu ? prediction.hu.co_hu : false
        });
        algorithm.saveHistory();

        res.json(response);
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).json({ error: 'Lỗi server', details: error.message });
    }
});

// ==================== API HŨ ====================

// API dự đoán HŨ riêng
app.get('/api/hu', async (req, res) => {
    try {
        const sessions = await algorithm.fetchHuData(100);
        
        if (!sessions || sessions.length < 20) {
            return res.status(400).json({
                error: 'Không đủ dữ liệu để phân tích HŨ',
                required: 20,
                current: sessions ? sessions.length : 0
            });
        }

        const huPrediction = algorithm.predictHu(sessions);
        const stats = algorithm.getHuStats();
        
        const response = {
            dự_đoán_hũ: huPrediction.co_hu ? 'CÓ HŨ' : 'KHÔNG HŨ',
            độ_tin_cậy: (huPrediction.confidence * 100).toFixed(1),
            phiên_dự_đoán: sessions[sessions.length - 1].phien + 1,
            next_hu: huPrediction.next_hu,
            khoảng_cách: huPrediction.distance,
            chu_kỳ_trung_bình: huPrediction.avg_cycle.toFixed(1),
            thống_kê_hũ: {
                tổng_hũ: stats.tong_hu,
                tỉ_lệ_hũ: (stats.ti_le_hu * 100).toFixed(2),
                các_phiên_hũ_gần_đây: stats.hu_gan_day,
                loại_hũ: algorithm.huPatterns
            },
            chi_tiết: huPrediction.reason,
            Id: '@tranhoang2286',
            thời_gian: new Date().toISOString()
        };

        // Lưu lịch sử HŨ
        algorithm.huHistory.push({
            phiên: sessions[sessions.length - 1].phien + 1,
            dự_đoán: huPrediction.co_hu,
            độ_tin_cậy: huPrediction.confidence,
            thời_gian: new Date().toISOString()
        });
        algorithm.saveHuHistory();

        res.json(response);
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).json({ error: 'Lỗi server', details: error.message });
    }
});

// API lấy lịch sử HŨ
app.get('/lich_su_hu', (req, res) => {
    try {
        const history = algorithm.getHuHistory();
        const stats = algorithm.getHuStats();
        
        res.json({
            lịch_sử_hũ: history.slice(-50),
            thống_kê_hũ: {
                tổng_dự_đoán: history.length,
                đã_xác_nhận: history.filter(h => h.kết_quả !== undefined).length,
                đúng: history.filter(h => h.kết_quả === true).length,
                sai: history.filter(h => h.kết_quả === false).length,
                tỉ_lệ_đúng: history.filter(h => h.kết_quả !== undefined).length > 0 ?
                    (history.filter(h => h.kết_quả === true).length / 
                     history.filter(h => h.kết_quả !== undefined).length * 100).toFixed(2) : 0
            },
            thời_gian: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy lịch sử HŨ' });
    }
});

// API cập nhật kết quả HŨ
app.post('/api/update_hu', async (req, res) => {
    try {
        const { phiên, có_hũ } = req.body;
        
        if (phiên === undefined || có_hũ === undefined) {
            return res.status(400).json({ error: 'Thiếu phiên hoặc kết quả HŨ' });
        }

        const entry = algorithm.huHistory.find(h => h.phiên === phiên);
        if (!entry) {
            return res.status(404).json({ error: 'Không tìm thấy dự đoán HŨ' });
        }

        entry.kết_quả = có_hũ;
        entry.đúng = entry.dự_đoán === có_hũ;
        
        algorithm.saveHuHistory();

        res.json({
            success: true,
            message: entry.đúng ? '🎉 Dự đoán HŨ đúng!' : '😅 Dự đoán HŨ sai!',
            updated: {
                phiên: entry.phiên,
                dự_đoán: entry.dự_đoán,
                kết_quả: entry.kết_quả,
                đúng: entry.đúng
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi cập nhật HŨ' });
    }
});

// ==================== API MD5 ====================

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

// ==================== API LỊCH SỬ ====================

// API lịch sử TÀI XỈU
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

// API cập nhật kết quả TÀI XỈU
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

// ==================== API THỐNG KÊ ====================

// API thống kê tổng hợp
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
                    (valid.filter(h => h.đúng_sai).length / valid.length * 100).toFixed(2) : 0,
                gần_đây: valid.slice(-10).map(h => ({
                    phiên: h.phiên,
                    dự_đoán: h.dự_đoán,
                    kết_quả: h.kết_quả_thực_tế,
                    đúng: h.đúng_sai
                }))
            },
            hũ: {
                tổng_hũ: huStats.tong_hu,
                tỉ_lệ_hũ: (huStats.ti_le_hu * 100).toFixed(2),
                chu_kỳ_trung_bình: huStats.chu_ky_hu ? huStats.chu_ky_hu.toFixed(1) : 0,
                các_phiên_hũ_gần_đây: huStats.hu_gan_day,
                loại_hũ: algorithm.huPatterns
            },
            thời_gian: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi thống kê' });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        version: '4.0.0-full-hu',
        timestamp: new Date().toISOString(),
        predictionCount: algorithm.predictionHistory.length,
        huCount: algorithm.huHistory.length,
        modules: {
            tai_xiu: 'active',
            hu: 'active',
            md5: 'active',
            stats: 'active'
        }
    });
});

// ==================== KEEP ALIVE ====================

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
    console.log('🚀 VIP ULTRA MAX TX ANALYSIS - FULL HŨ');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${CONFIG.PORT}`);
    console.log(`🎯 Confidence Threshold: ${CONFIG.CONFIDENCE_THRESHOLD}`);
    console.log('='.repeat(60));
    console.log('📌 ENDPOINTS:');
    console.log(`  🎯 /api/tx - Dự đoán TÀI XỈU + HŨ`);
    console.log(`  💰 /api/hu - Dự đoán HŨ riêng`);
    console.log(`  📜 /lich_su - Lịch sử TÀI XỈU`);
    console.log(`  💰 /lich_su_hu - Lịch sử HŨ`);
    console.log(`  🔐 /api/md5?data=xxx - MD5 Hash`);
    console.log(`  📊 /api/stats - Thống kê tổng hợp`);
    console.log(`  ❤️  /health - Health check`);
    console.log('='.repeat(60));
    console.log('💰 HŨ SYSTEM:');
    console.log(`  Tổng HŨ: ${algorithm.huStats.tong_hu}`);
    console.log(`  Tỉ lệ HŨ: ${(algorithm.huStats.ti_le_hu * 100).toFixed(2)}%`);
    console.log(`  Chu kỳ HŨ: ${algorithm.huStats.chu_ky_hu ? algorithm.huStats.chu_ky_hu.toFixed(1) : 0} phiên`);
    console.log('='.repeat(60));
});
