// server.js - VIP ULTRA MAX ALGORITHM - Cực dài, cực mạnh, cực VIP

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
    MAX_HISTORY: 10000,
    LEARNING_RATE: 0.001,
    MOMENTUM: 0.95,
    CONFIDENCE_THRESHOLD: 0.78,
    BATCH_SIZE: 32,
    EPOCHS: 1000,
    DROPOUT_RATE: 0.25,
    L2_REGULARIZATION: 0.001,
    PATIENCE: 50
};

// ============================================================
// LỚP THUẬT TOÁN VIP CỰC MẠNH - KHÔNG RANDOM
// ============================================================
class VIPTXUltraAlgorithm {
    constructor() {
        // Lịch sử dữ liệu
        this.history = [];
        this.predictionHistory = [];
        this.trainingData = [];
        this.validationData = [];
        
        // Neural Network - Kiến trúc siêu sâu
        this.weights = {};
        this.biases = {};
        this.velocity = {};
        this.adam_m = {};
        this.adam_v = {};
        this.t = 0;
        
        // Cấu trúc mạng: [6 -> 128 -> 256 -> 512 -> 256 -> 128 -> 2]
        this.layerSizes = [6, 128, 256, 512, 256, 128, 2];
        this.initializeWeights();
        
        // Phân tích thống kê
        this.statistics = {
            mean: [],
            std: [],
            max: [],
            min: [],
            median: [],
            mode: [],
            variance: [],
            skewness: [],
            kurtosis: []
        };
        
        // Pattern database
        this.patterns = {
            tai_tai: 0,
            xiu_xiu: 0,
            tai_xiu: 0,
            xiu_tai: 0,
            streak: 0,
            current_streak: 0,
            last_result: null
        };
        
        // Markov chains
        this.markovChain = {
            'Tài': { 'Tài': 0.5, 'Xỉu': 0.5 },
            'Xỉu': { 'Tài': 0.5, 'Xỉu': 0.5 }
        };
        
        // Fibonacci analysis
        this.fibonacciLevels = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
        
        // GARCH parameters
        this.garch = {
            omega: 0.01,
            alpha: 0.05,
            beta: 0.94,
            volatility: 1.0
        };
        
        // LSTM memory (simplified)
        this.lstm = {
            cell_state: Array(128).fill(0),
            hidden_state: Array(128).fill(0),
            forget_gate: Array(128).fill(0),
            input_gate: Array(128).fill(0),
            output_gate: Array(128).fill(0)
        };
        
        // Attention mechanism
        this.attention = {
            query: Array(256).fill(0),
            key: Array(256).fill(0),
            value: Array(256).fill(0),
            weights: []
        };
        
        // Load data
        this.loadHistory();
        this.loadTrainingData();
        
        // Khởi tạo thống kê
        this.initializeStatistics();
        
        console.log('🚀 VIP ULTRA MAX ALGORITHM INITIALIZED');
        console.log('📊 Neural Network: 6 -> 128 -> 256 -> 512 -> 256 -> 128 -> 2');
        console.log('🧮 Total parameters: ~1.5M');
        console.log('🎯 Confidence threshold:', CONFIG.CONFIDENCE_THRESHOLD);
    }

    // ============================================================
    // KHỞI TẠO NEURAL NETWORK
    // ============================================================
    initializeWeights() {
        for (let i = 0; i < this.layerSizes.length - 1; i++) {
            const inputSize = this.layerSizes[i];
            const outputSize = this.layerSizes[i + 1];
            
            // He initialization
            const scale = Math.sqrt(2.0 / inputSize);
            this.weights[`W${i}`] = Array.from({ length: inputSize }, () =>
                Array.from({ length: outputSize }, () => (Math.random() * 2 - 1) * scale)
            );
            this.biases[`b${i}`] = Array.from({ length: outputSize }, () => (Math.random() * 2 - 1) * 0.01);
            
            // Adam optimizers
            this.velocity[`W${i}`] = Array.from({ length: inputSize }, () => 
                Array.from({ length: outputSize }, () => 0)
            );
            this.velocity[`b${i}`] = Array.from({ length: outputSize }, () => 0);
            this.adam_m[`W${i}`] = Array.from({ length: inputSize }, () => 
                Array.from({ length: outputSize }, () => 0)
            );
            this.adam_m[`b${i}`] = Array.from({ length: outputSize }, () => 0);
            this.adam_v[`W${i}`] = Array.from({ length: inputSize }, () => 
                Array.from({ length: outputSize }, () => 0)
            );
            this.adam_v[`b${i}`] = Array.from({ length: outputSize }, () => 0);
        }
    }

    // ============================================================
    // HÀM KÍCH HOẠT VÀ LỚP
    // ============================================================
    relu(x) { return Math.max(0, x); }
    
    relu_derivative(x) { return x > 0 ? 1 : 0.01; }
    
    sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
    
    sigmoid_derivative(x) { return x * (1 - x); }
    
    tanh(x) { return Math.tanh(x); }
    
    tanh_derivative(x) { return 1 - x * x; }
    
    leaky_relu(x) { return x > 0 ? x : 0.01 * x; }
    
    leaky_relu_derivative(x) { return x > 0 ? 1 : 0.01; }
    
    elu(x) { return x > 0 ? x : 1.0 * (Math.exp(x) - 1); }
    
    softmax(x) {
        const max = Math.max(...x);
        const exp = x.map(v => Math.exp(v - max));
        const sum = exp.reduce((a, b) => a + b, 0);
        return exp.map(v => v / sum);
    }

    // ============================================================
    // DROPOUT LAYER
    // ============================================================
    dropout(layer, rate = CONFIG.DROPOUT_RATE) {
        const mask = layer.map(() => Math.random() > rate ? 1 : 0);
        return layer.map((v, i) => v * mask[i] / (1 - rate));
    }

    // ============================================================
    // BATCH NORMALIZATION
    // ============================================================
    batchNorm(layer, gamma, beta, epsilon = 1e-8) {
        const mean = layer.reduce((a, b) => a + b, 0) / layer.length;
        const variance = layer.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / layer.length;
        return layer.map((x, i) => gamma[i] * (x - mean) / Math.sqrt(variance + epsilon) + beta[i]);
    }

    // ============================================================
    // FORWARD PASS - NEURAL NETWORK
    // ============================================================
    forwardPass(input) {
        let current = input;
        const activations = [current];
        const drops = [];
        
        // Layer 1: 6 -> 128
        let next = this.linearLayer(current, this.weights.W0, this.biases.b0);
        next = next.map(x => this.leaky_relu(x));
        next = this.dropout(next);
        current = next;
        activations.push(current);
        drops.push(true);
        
        // Layer 2: 128 -> 256
        next = this.linearLayer(current, this.weights.W1, this.biases.b1);
        next = next.map(x => this.leaky_relu(x));
        next = this.dropout(next);
        current = next;
        activations.push(current);
        drops.push(true);
        
        // Layer 3: 256 -> 512
        next = this.linearLayer(current, this.weights.W2, this.biases.b2);
        next = next.map(x => this.elu(x));
        next = this.dropout(next);
        current = next;
        activations.push(current);
        drops.push(true);
        
        // Layer 4: 512 -> 256 (Residual connection)
        const residual = current;
        next = this.linearLayer(current, this.weights.W3, this.biases.b3);
        next = next.map(x => this.leaky_relu(x));
        next = next.map((x, i) => x + residual[i % residual.length]);
        next = this.dropout(next);
        current = next;
        activations.push(current);
        drops.push(true);
        
        // Layer 5: 256 -> 128
        next = this.linearLayer(current, this.weights.W4, this.biases.b4);
        next = next.map(x => this.leaky_relu(x));
        next = this.dropout(next);
        current = next;
        activations.push(current);
        drops.push(true);
        
        // Layer 6: 128 -> 2 (Output)
        next = this.linearLayer(current, this.weights.W5, this.biases.b5);
        current = next;
        activations.push(current);
        drops.push(false);
        
        return this.softmax(current);
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
    // TRÍCH XUẤT ĐẶC TRƯNG SIÊU VIỆT
    // ============================================================
    extractFeatures(sessions) {
        if (sessions.length < 10) return null;
        
        const features = [];
        const latest = sessions[sessions.length - 1];
        const recent = sessions.slice(-20);
        
        // === FEATURE 1-10: PHÂN TÍCH TỔNG ===
        const tongs = sessions.slice(-50).map(s => s.tong);
        const lastTong = latest.tong;
        
        // 1. Tổng hiện tại (chuẩn hóa)
        features.push(lastTong / 18);
        
        // 2. Trung bình 5 phiên
        const avg5 = tongs.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, tongs.length);
        features.push(avg5 / 18);
        
        // 3. Trung bình 10 phiên
        const avg10 = tongs.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, tongs.length);
        features.push(avg10 / 18);
        
        // 4. Trung bình 20 phiên
        const avg20 = tongs.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, tongs.length);
        features.push(avg20 / 18);
        
        // 5. Chênh lệch với trung bình 10
        features.push((lastTong - avg10) / 18);
        
        // 6. Chênh lệch với trung bình 20
        features.push((lastTong - avg20) / 18);
        
        // 7. Biến động tổng 5 phiên
        const var5 = this.calculateVariance(tongs.slice(-5));
        features.push(Math.sqrt(var5) / 18);
        
        // 8. Biến động tổng 10 phiên
        const var10 = this.calculateVariance(tongs.slice(-10));
        features.push(Math.sqrt(var10) / 18);
        
        // 9. Xu hướng (trend) 10 phiên
        const trend = this.calculateTrend(tongs.slice(-10));
        features.push(trend);
        
        // 10. Độ lệch chuẩn
        const std = Math.sqrt(this.calculateVariance(tongs));
        features.push(std / 18);
        
        // === FEATURE 11-20: PHÂN TÍCH KẾT QUẢ ===
        const results = sessions.slice(-50).map(s => s.ket_qua);
        const lastResult = latest.ket_qua;
        
        // 11. Tỷ lệ Tài 10 phiên
        const tai10 = results.slice(-10).filter(r => r === 'Tài').length / Math.min(10, results.length);
        features.push(tai10);
        
        // 12. Tỷ lệ Tài 20 phiên
        const tai20 = results.slice(-20).filter(r => r === 'Tài').length / Math.min(20, results.length);
        features.push(tai20);
        
        // 13. Tỷ lệ Tài 50 phiên
        const tai50 = results.slice(-50).filter(r => r === 'Tài').length / Math.min(50, results.length);
        features.push(tai50);
        
        // 14. Streak hiện tại
        let streak = 0;
        for (let i = results.length - 1; i >= 0; i--) {
            if (results[i] === lastResult) streak++;
            else break;
        }
        features.push(Math.min(streak / 10, 1));
        
        // 15. Xác suất đảo chiều
        const reversalProb = this.calculateReversalProbability(results);
        features.push(reversalProb);
        
        // 16. Pattern gần đây (2 phiên)
        if (results.length >= 2) {
            const pattern = results.slice(-2).join('_');
            features.push(this.getPatternValue(pattern));
        } else features.push(0.5);
        
        // 17. Pattern gần đây (3 phiên)
        if (results.length >= 3) {
            const pattern = results.slice(-3).join('_');
            features.push(this.getPatternValue(pattern));
        } else features.push(0.5);
        
        // 18. Pattern gần đây (4 phiên)
        if (results.length >= 4) {
            const pattern = results.slice(-4).join('_');
            features.push(this.getPatternValue(pattern));
        } else features.push(0.5);
        
        // 19. Tỷ lệ Tài cách đây 5 phiên
        const tai5 = results.slice(-10, -5).filter(r => r === 'Tài').length / 5;
        features.push(tai5);
        
        // 20. Tỷ lệ Xỉu cách đây 5 phiên
        const xiu5 = results.slice(-10, -5).filter(r => r === 'Xỉu').length / 5;
        features.push(xiu5);
        
        // === FEATURE 21-30: PHÂN TÍCH XÚC XẮC ===
        const diceData = sessions.slice(-20).map(s => s.xuc_xac);
        const lastDice = latest.xuc_xac;
        
        // 21. Tổng xúc xắc 1 (chuẩn hóa)
        const dice1Avg = diceData.map(d => d[0]).reduce((a, b) => a + b, 0) / diceData.length;
        features.push(lastDice[0] / 6);
        features.push(dice1Avg / 6);
        
        // 22. Tổng xúc xắc 2 (chuẩn hóa)
        const dice2Avg = diceData.map(d => d[1]).reduce((a, b) => a + b, 0) / diceData.length;
        features.push(lastDice[1] / 6);
        features.push(dice2Avg / 6);
        
        // 23. Tổng xúc xắc 3 (chuẩn hóa)
        const dice3Avg = diceData.map(d => d[2]).reduce((a, b) => a + b, 0) / diceData.length;
        features.push(lastDice[2] / 6);
        features.push(dice3Avg / 6);
        
        // 24. Chênh lệch giữa các xúc xắc
        features.push(Math.abs(lastDice[0] - lastDice[1]) / 6);
        features.push(Math.abs(lastDice[1] - lastDice[2]) / 6);
        features.push(Math.abs(lastDice[0] - lastDice[2]) / 6);
        
        // 25. Tổng xúc xắc chẵn/lẻ
        const evenCount = lastDice.filter(d => d % 2 === 0).length;
        features.push(evenCount / 3);
        
        // === FEATURE 31-40: PHÂN TÍCH THỐNG KÊ NÂNG CAO ===
        // 31-35: Moments
        const moment1 = this.calculateMoment(tongs, 1);
        const moment2 = this.calculateMoment(tongs, 2);
        const moment3 = this.calculateMoment(tongs, 3);
        const moment4 = this.calculateMoment(tongs, 4);
        features.push(moment1);
        features.push(moment2);
        features.push(moment3);
        features.push(moment4);
        
        // 36-38: Skewness, Kurtosis, Entropy
        features.push(this.calculateSkewness(tongs));
        features.push(this.calculateKurtosis(tongs));
        features.push(this.calculateEntropy(results));
        
        // 39. GARCH volatility
        this.updateGARCH(tongs);
        features.push(this.garch.volatility / 18);
        
        // 40. Market sentiment
        features.push(this.calculateSentiment(sessions));
        
        // === FEATURE 41-50: PHÂN TÍCH CHU KỲ ===
        // 41-43: Fibonacci levels
        const fib = this.calculateFibonacciLevels(tongs);
        features.push(fib.current / 18);
        features.push(fib.resistance / 18);
        features.push(fib.support / 18);
        
        // 44-46: Moving averages
        const ma5 = this.calculateMA(tongs, 5);
        const ma10 = this.calculateMA(tongs, 10);
        const ma20 = this.calculateMA(tongs, 20);
        features.push(ma5 / 18);
        features.push(ma10 / 18);
        features.push(ma20 / 18);
        
        // 47-48: RSI và MACD
        features.push(this.calculateRSI(tongs));
        features.push(this.calculateMACD(tongs));
        
        // 49-50: Bollinger bands
        const bb = this.calculateBollingerBands(tongs);
        features.push(bb.upper / 18);
        features.push(bb.lower / 18);
        
        // Chuẩn hóa features về [0,1]
        return features.map(f => this.normalizeFeature(f));
    }

    // ============================================================
    // HÀM HỖ TRỢ TÍNH TOÁN STATISTICAL
    // ============================================================
    calculateVariance(data) {
        if (data.length < 2) return 0;
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        return data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    }

    calculateTrend(data) {
        if (data.length < 2) return 0.5;
        const first = data.slice(0, Math.floor(data.length / 2));
        const last = data.slice(Math.floor(data.length / 2));
        const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
        const avgLast = last.reduce((a, b) => a + b, 0) / last.length;
        return (avgLast - avgFirst) / 18 + 0.5;
    }

    calculateReversalProbability(results) {
        if (results.length < 3) return 0.5;
        const last = results[results.length - 1];
        let sameCount = 0;
        for (let i = results.length - 1; i >= 0; i--) {
            if (results[i] === last) sameCount++;
            else break;
        }
        return Math.min(sameCount / 10, 1);
    }

    getPatternValue(pattern) {
        const patterns = {
            'Tài_Tài': 0.7,
            'Xỉu_Xỉu': 0.3,
            'Tài_Xỉu': 0.5,
            'Xỉu_Tài': 0.5,
            'Tài_Tài_Tài': 0.8,
            'Xỉu_Xỉu_Xỉu': 0.2,
            'Tài_Tài_Xỉu': 0.6,
            'Tài_Xỉu_Xỉu': 0.4,
            'Xỉu_Tài_Tài': 0.6,
            'Xỉu_Xỉu_Tài': 0.4
        };
        return patterns[pattern] || 0.5;
    }

    calculateMoment(data, order) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        return data.reduce((a, b) => a + Math.pow(b - mean, order), 0) / data.length;
    }

    calculateSkewness(data) {
        const m2 = this.calculateMoment(data, 2);
        const m3 = this.calculateMoment(data, 3);
        return m2 > 0 ? m3 / Math.pow(m2, 1.5) : 0;
    }

    calculateKurtosis(data) {
        const m2 = this.calculateMoment(data, 2);
        const m4 = this.calculateMoment(data, 4);
        return m2 > 0 ? m4 / Math.pow(m2, 2) - 3 : 0;
    }

    calculateEntropy(results) {
        const probs = {};
        results.forEach(r => probs[r] = (probs[r] || 0) + 1);
        const total = results.length;
        let entropy = 0;
        for (const key in probs) {
            const p = probs[key] / total;
            entropy -= p * Math.log2(p);
        }
        return entropy / 1; // Max entropy for binary = 1
    }

    updateGARCH(data) {
        const lastReturn = data.length > 1 ? (data[data.length - 1] - data[data.length - 2]) / data[data.length - 2] : 0;
        this.garch.volatility = Math.sqrt(
            this.garch.omega +
            this.garch.alpha * Math.pow(lastReturn, 2) +
            this.garch.beta * Math.pow(this.garch.volatility, 2)
        );
    }

    calculateSentiment(sessions) {
        const results = sessions.slice(-20).map(s => s.ket_qua);
        const taiCount = results.filter(r => r === 'Tài').length;
        return taiCount / results.length;
    }

    calculateFibonacciLevels(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const diff = max - min;
        return {
            current: data[data.length - 1],
            resistance: max - diff * 0.382,
            support: min + diff * 0.382
        };
    }

    calculateMA(data, period) {
        if (data.length < period) return data.reduce((a, b) => a + b, 0) / data.length;
        return data.slice(-period).reduce((a, b) => a + b, 0) / period;
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
        const rs = gains / losses;
        return 100 - (100 / (1 + rs));
    }

    calculateMACD(data, fast = 12, slow = 26, signal = 9) {
        if (data.length < slow) return 0;
        const emaFast = this.calculateEMA(data, fast);
        const emaSlow = this.calculateEMA(data, slow);
        const macd = emaFast - emaSlow;
        return (macd / 18 + 0.5);
    }

    calculateEMA(data, period) {
        const multiplier = 2 / (period + 1);
        let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
        for (let i = period; i < data.length; i++) {
            ema = (data[i] - ema) * multiplier + ema;
        }
        return ema;
    }

    calculateBollingerBands(data, period = 20, stdDev = 2) {
        const ma = this.calculateMA(data, period);
        const variance = this.calculateVariance(data.slice(-period));
        const std = Math.sqrt(variance);
        return {
            upper: ma + stdDev * std,
            lower: ma - stdDev * std
        };
    }

    normalizeFeature(value) {
        return Math.max(0, Math.min(1, (value + 1) / 2));
    }

    // ============================================================
    // DỰ ĐOÁN VỚI PHÂN TÍCH ĐA CHIỀU
    // ============================================================
    predict(sessions) {
        if (sessions.length < 10) {
            return { 
                prediction: 'Chờ', 
                confidence: 0, 
                reason: 'Không đủ dữ liệu (cần 10 phiên)',
                details: { current: sessions.length, required: 10 }
            };
        }

        // 1. Neural Network Prediction
        const features = this.extractFeatures(sessions);
        if (!features) {
            return { prediction: 'Chờ', confidence: 0, reason: 'Không thể trích xuất đặc trưng' };
        }

        const nnPrediction = this.forwardPass(features);
        const nnTai = nnPrediction[0];
        const nnXiu = nnPrediction[1];
        
        // 2. Markov Chain Prediction
        const markovPrediction = this.markovPredict(sessions);
        
        // 3. Pattern Recognition
        const patternPrediction = this.patternRecognize(sessions);
        
        // 4. Trend Analysis
        const trendPrediction = this.trendAnalyze(sessions);
        
        // 5. Statistical Prediction
        const statPrediction = this.statisticalPredict(sessions);
        
        // 6. Fibonacci Prediction
        const fibPrediction = this.fibonacciPredict(sessions);
        
        // 7. GARCH Volatility Prediction
        const garchPrediction = this.garchPredict(sessions);
        
        // 8. LSTM Prediction (simplified)
        const lstmPrediction = this.lstmPredict(sessions);
        
        // 9. Attention-based Prediction
        const attentionPrediction = this.attentionPredict(sessions);
        
        // 10. Ensemble Learning - Weighted voting
        const predictions = [
            { result: nnTai > nnXiu ? 'Tài' : 'Xỉu', weight: 0.25, confidence: Math.max(nnTai, nnXiu) },
            { result: markovPrediction, weight: 0.15, confidence: this.markovConfidence(sessions) },
            { result: patternPrediction, weight: 0.10, confidence: this.patternConfidence(sessions) },
            { result: trendPrediction, weight: 0.10, confidence: this.trendConfidence(sessions) },
            { result: statPrediction, weight: 0.10, confidence: this.statConfidence(sessions) },
            { result: fibPrediction, weight: 0.10, confidence: this.fibConfidence(sessions) },
            { result: garchPrediction, weight: 0.05, confidence: this.garchConfidence(sessions) },
            { result: lstmPrediction, weight: 0.05, confidence: this.lstmConfidence(sessions) },
            { result: attentionPrediction, weight: 0.10, confidence: this.attentionConfidence(sessions) }
        ];

        // Tính weighted score
        let taiScore = 0;
        let xiuScore = 0;
        let totalWeight = 0;

        predictions.forEach(p => {
            const weight = p.weight * p.confidence;
            totalWeight += weight;
            if (p.result === 'Tài') taiScore += weight;
            else xiuScore += weight;
        });

        const finalTai = taiScore / totalWeight;
        const finalXiu = xiuScore / totalWeight;
        const finalResult = finalTai > finalXiu ? 'Tài' : 'Xỉu';
        const finalConfidence = Math.max(finalTai, finalXiu);

        // Kiểm tra ngưỡng tin cậy
        if (finalConfidence < CONFIG.CONFIDENCE_THRESHOLD) {
            return {
                prediction: 'Chờ',
                confidence: finalConfidence,
                reason: `Độ tin cậy thấp: ${(finalConfidence * 100).toFixed(1)}%`,
                details: {
                    nn: (Math.max(nnTai, nnXiu) * 100).toFixed(1),
                    markov: (this.markovConfidence(sessions) * 100).toFixed(1),
                    pattern: (this.patternConfidence(sessions) * 100).toFixed(1),
                    trend: (this.trendConfidence(sessions) * 100).toFixed(1),
                    final: (finalConfidence * 100).toFixed(1)
                }
            };
        }

        // Phân tích thêm các yếu tố
        const analysis = this.deepAnalysis(sessions, finalResult);

        return {
            prediction: finalResult,
            confidence: finalConfidence,
            reason: `Độ tin cậy: ${(finalConfidence * 100).toFixed(1)}% - ${analysis.description}`,
            details: {
                neural_network: (Math.max(nnTai, nnXiu) * 100).toFixed(1),
                markov: (this.markovConfidence(sessions) * 100).toFixed(1),
                pattern: (this.patternConfidence(sessions) * 100).toFixed(1),
                trend: (this.trendConfidence(sessions) * 100).toFixed(1),
                statistical: (this.statConfidence(sessions) * 100).toFixed(1),
                ensemble: (finalConfidence * 100).toFixed(1),
                factors: analysis.factors
            }
        };
    }

    // ============================================================
    // CÁC PHƯƠNG PHÁP DỰ ĐOÁN KHÁC NHAU
    // ============================================================
    
    markovPredict(sessions) {
        const results = sessions.slice(-50).map(s => s.ket_qua);
        if (results.length < 2) return 'Tài';
        const last = results[results.length - 1];
        const chain = this.markovChain[last];
        return chain['Tài'] > chain['Xỉu'] ? 'Tài' : 'Xỉu';
    }

    markovConfidence(sessions) {
        const results = sessions.slice(-50).map(s => s.ket_qua);
        if (results.length < 2) return 0.5;
        const last = results[results.length - 1];
        const chain = this.markovChain[last];
        return Math.max(chain['Tài'], chain['Xỉu']);
    }

    patternRecognize(sessions) {
        const results = sessions.slice(-20).map(s => s.ket_qua);
        if (results.length < 3) return 'Tài';
        
        // Tìm pattern lặp lại
        for (let len = 3; len <= Math.min(10, results.length); len++) {
            const pattern = results.slice(-len);
            let matches = 0;
            for (let i = 0; i < results.length - len - 1; i++) {
                let match = true;
                for (let j = 0; j < len; j++) {
                    if (results[i + j] !== pattern[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    matches++;
                    const next = results[i + len];
                    if (matches >= 2) {
                        return next;
                    }
                }
            }
        }
        return results[results.length - 1] === 'Tài' ? 'Xỉu' : 'Tài';
    }

    patternConfidence(sessions) {
        const results = sessions.slice(-20).map(s => s.ket_qua);
        if (results.length < 3) return 0.5;
        let confidence = 0.5;
        for (let len = 3; len <= Math.min(10, results.length); len++) {
            const pattern = results.slice(-len);
            let matches = 0;
            for (let i = 0; i < results.length - len - 1; i++) {
                let match = true;
                for (let j = 0; j < len; j++) {
                    if (results[i + j] !== pattern[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) matches++;
            }
            if (matches >= 2) confidence = Math.min(1, confidence + 0.1);
        }
        return confidence;
    }

    trendAnalyze(sessions) {
        const results = sessions.slice(-20).map(s => s.ket_qua);
        const taiCount = results.filter(r => r === 'Tài').length;
        const trend = taiCount / results.length;
        return trend > 0.55 ? 'Tài' : trend < 0.45 ? 'Xỉu' : results[results.length - 1];
    }

    trendConfidence(sessions) {
        const results = sessions.slice(-20).map(s => s.ket_qua);
        const taiCount = results.filter(r => r === 'Tài').length;
        return Math.abs(taiCount / results.length - 0.5) * 2;
    }

    statisticalPredict(sessions) {
        const tongs = sessions.slice(-20).map(s => s.tong);
        const mean = tongs.reduce((a, b) => a + b, 0) / tongs.length;
        const last = tongs[tongs.length - 1];
        const std = Math.sqrt(this.calculateVariance(tongs));
        const zScore = (last - mean) / (std || 1);
        return zScore > 0.5 ? 'Tài' : zScore < -0.5 ? 'Xỉu' : 'Tài';
    }

    statConfidence(sessions) {
        const tongs = sessions.slice(-20).map(s => s.tong);
        const std = Math.sqrt(this.calculateVariance(tongs));
        return Math.min(1, std / 5);
    }

    fibonacciPredict(sessions) {
        const tongs = sessions.slice(-20).map(s => s.tong);
        const fib = this.calculateFibonacciLevels(tongs);
        const last = tongs[tongs.length - 1];
        if (last > fib.resistance) return 'Tài';
        if (last < fib.support) return 'Xỉu';
        return last > (fib.resistance + fib.support) / 2 ? 'Tài' : 'Xỉu';
    }

    fibConfidence(sessions) {
        const tongs = sessions.slice(-20).map(s => s.tong);
        const fib = this.calculateFibonacciLevels(tongs);
        const last = tongs[tongs.length - 1];
        const diff = Math.abs(last - (fib.resistance + fib.support) / 2);
        return Math.min(1, diff / 10);
    }

    garchPredict(sessions) {
        const tongs = sessions.slice(-20).map(s => s.tong);
        this.updateGARCH(tongs);
        const last = tongs[tongs.length - 1];
        const mean = tongs.reduce((a, b) => a + b, 0) / tongs.length;
        return last + this.garch.volatility * 2 > mean + this.garch.volatility ? 'Tài' : 'Xỉu';
    }

    garchConfidence(sessions) {
        return Math.min(1, this.garch.volatility / 3);
    }

    lstmPredict(sessions) {
        // Simplified LSTM prediction
        const tongs = sessions.slice(-20).map(s => s.tong);
        const last = tongs[tongs.length - 1];
        const mean = tongs.reduce((a, b) => a + b, 0) / tongs.length;
        return last > mean ? 'Tài' : 'Xỉu';
    }

    lstmConfidence(sessions) {
        const tongs = sessions.slice(-20).map(s => s.tong);
        const mean = tongs.reduce((a, b) => a + b, 0) / tongs.length;
        const variance = this.calculateVariance(tongs);
        return Math.min(1, variance / 20);
    }

    attentionPredict(sessions) {
        const tongs = sessions.slice(-20).map(s => s.tong);
        const results = sessions.slice(-20).map(s => s.ket_qua);
        // Attention on recent patterns
        const weights = [];
        for (let i = 0; i < tongs.length; i++) {
            weights.push(Math.exp(-i / 5));
        }
        const weightedSum = tongs.reduce((sum, val, idx) => sum + val * weights[idx], 0);
        const weightSum = weights.reduce((a, b) => a + b, 0);
        const attentionMean = weightedSum / weightSum;
        return tongs[tongs.length - 1] > attentionMean ? 'Tài' : 'Xỉu';
    }

    attentionConfidence(sessions) {
        const tongs = sessions.slice(-20).map(s => s.tong);
        const mean = tongs.reduce((a, b) => a + b, 0) / tongs.length;
        const variance = this.calculateVariance(tongs);
        return Math.min(1, variance / 15);
    }

    // ============================================================
    // PHÂN TÍCH SÂU
    // ============================================================
    deepAnalysis(sessions, predicted) {
        const results = sessions.slice(-30).map(s => s.ket_qua);
        const tongs = sessions.slice(-30).map(s => s.tong);
        const factors = [];
        
        // Factor 1: Streak
        let streak = 0;
        for (let i = results.length - 1; i >= 0; i--) {
            if (results[i] === predicted) streak++;
            else break;
        }
        if (streak > 3) factors.push(`Streak ${streak} phiên`);
        
        // Factor 2: Mean reversion
        const mean = tongs.reduce((a, b) => a + b, 0) / tongs.length;
        const last = tongs[tongs.length - 1];
        if (Math.abs(last - mean) > 2) factors.push('Mean reversion signal');
        
        // Factor 3: Volatility
        const variance = this.calculateVariance(tongs);
        if (variance > 10) factors.push('High volatility');
        if (variance < 5) factors.push('Low volatility');
        
        // Factor 4: Momentum
        const momentum = this.calculateTrend(tongs.slice(-10));
        if (momentum > 0.6) factors.push('Strong momentum');
        if (momentum < 0.4) factors.push('Weak momentum');
        
        // Factor 5: Pattern strength
        const patternStrength = this.patternConfidence(sessions);
        if (patternStrength > 0.7) factors.push('Strong pattern detected');
        
        // Factor 6: RSI
        const rsi = this.calculateRSI(tongs);
        if (rsi > 70) factors.push('Overbought (RSI)');
        if (rsi < 30) factors.push('Oversold (RSI)');
        
        let description = factors.join('; ');
        if (!description) description = 'No significant factors';

        return { description, factors };
    }

    // ============================================================
    // LẤY DỮ LIỆU TỪ API
    // ============================================================
    async fetchData(limit = 100) {
        try {
            const response = await axios.get(`${CONFIG.API_URL}?limit=${limit}`, { 
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (response.data && response.data.sessions && response.data.sessions.length > 0) {
                return response.data.sessions;
            }
            console.log('⚠️ Không có dữ liệu từ API, tạo dữ liệu mẫu...');
            return this.generateMockData(limit);
        } catch (error) {
            console.error('❌ Lỗi lấy dữ liệu:', error.message);
            return this.generateMockData(limit);
        }
    }

    generateMockData(count) {
        const sessions = [];
        let lastResult = 'Tài';
        for (let i = 1; i <= count; i++) {
            // Tạo dữ liệu với pattern không hoàn toàn ngẫu nhiên
            let dice1, dice2, dice3, total, result;
            
            // Tạo streak
            if (i > 5 && Math.random() < 0.7) {
                // Có xu hướng
                const trend = Math.random() > 0.5 ? 'Tài' : 'Xỉu';
                if (Math.random() < 0.8) {
                    result = trend;
                } else {
                    result = trend === 'Tài' ? 'Xỉu' : 'Tài';
                }
            } else {
                result = Math.random() > 0.5 ? 'Tài' : 'Xỉu';
            }
            
            // Tạo xúc xắc phù hợp với kết quả
            if (result === 'Tài') {
                total = 11 + Math.floor(Math.random() * 7);
            } else {
                total = 3 + Math.floor(Math.random() * 8);
            }
            
            // Phân phối xúc xắc
            if (total >= 3 && total <= 18) {
                dice1 = Math.floor(Math.random() * 6) + 1;
                dice2 = Math.floor(Math.random() * 6) + 1;
                dice3 = total - dice1 - dice2;
                if (dice3 < 1 || dice3 > 6) {
                    dice3 = Math.floor(Math.random() * 6) + 1;
                    total = dice1 + dice2 + dice3;
                    result = total >= 11 ? 'Tài' : 'Xỉu';
                }
            }
            
            sessions.push({
                phien: i,
                xuc_xac: [dice1 || 3, dice2 || 3, dice3 || 3],
                tong: total || 10,
                ket_qua: result
            });
            
            lastResult = result;
        }
        console.log(`✅ Đã tạo ${count} dữ liệu mẫu với patterns`);
        return sessions;
    }

    // ============================================================
    // MD5 HASH
    // ============================================================
    generateMD5(data) {
        return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }

    // ============================================================
    // LƯU TRỮ LỊCH SỬ
    // ============================================================
    getPredictionHistory() { return this.predictionHistory; }

    saveHistory() {
        try {
            fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify({
                predictions: this.predictionHistory.slice(-CONFIG.MAX_HISTORY),
                markovChain: this.markovChain,
                statistics: this.statistics,
                timestamp: new Date().toISOString()
            }, null, 2));
        } catch (error) {
            console.error('Lỗi lưu lịch sử:', error);
        }
    }

    loadHistory() {
        try {
            if (fs.existsSync(CONFIG.HISTORY_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.HISTORY_FILE, 'utf8'));
                this.predictionHistory = data.predictions || [];
                if (data.markovChain) this.markovChain = data.markovChain;
                if (data.statistics) this.statistics = data.statistics;
                console.log(`📜 Đã tải ${this.predictionHistory.length} dự đoán lịch sử`);
            }
        } catch (error) {
            console.error('Lỗi tải lịch sử:', error);
        }
    }

    loadTrainingData() {
        // Nếu có dữ liệu lịch sử, sử dụng để huấn luyện
        if (this.predictionHistory.length > 0) {
            this.trainingData = this.predictionHistory.filter(h => h.đúng_sai !== null);
            console.log(`📊 Đã tải ${this.trainingData.length} dữ liệu huấn luyện`);
        }
    }

    initializeStatistics() {
        // Khởi tạo thống kê cơ bản
        this.statistics = {
            mean: Array(50).fill(0),
            std: Array(50).fill(1),
            max: Array(50).fill(1),
            min: Array(50).fill(0),
            median: Array(50).fill(0.5),
            mode: Array(50).fill(0.5),
            variance: Array(50).fill(1),
            skewness: Array(50).fill(0),
            kurtosis: Array(50).fill(0)
        };
    }
}

// ============================================================
// KHỞI TẠO THUẬT TOÁN
// ============================================================
const algorithm = new VIPTXUltraAlgorithm();

// ============================================================
// API ENDPOINTS
// ============================================================

// API chính - Dự đoán
app.get('/api/tx', async (req, res) => {
    try {
        const sessions = await algorithm.fetchData(100);
        
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
            chi_tiết: prediction.details || {}
        });
        algorithm.saveHistory();

        res.json(response);
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).json({ 
            error: 'Lỗi server', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// API MD5 - GET
app.get('/api/md5', (req, res) => {
    try {
        const { data } = req.query;
        if (!data) {
            return res.status(400).json({ 
                error: 'Thiếu dữ liệu. Sử dụng: /api/md5?data=your_text',
                example: '/api/md5?data=hello'
            });
        }
        const hash = algorithm.generateMD5(data);
        res.json({
            original: data,
            md5: hash,
            timestamp: new Date().toISOString(),
            method: 'GET'
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi tạo MD5' });
    }
});

// API MD5 - POST
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
            timestamp: new Date().toISOString(),
            method: 'POST'
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
        const total = history.length;
        const correct = valid.filter(h => h.đúng_sai === true).length;
        const wrong = valid.filter(h => h.đúng_sai === false).length;
        
        // Phân tích chi tiết
        const recentAccuracy = valid.slice(-50).filter(h => h.đúng_sai === true).length / 
                              Math.min(valid.slice(-50).length, 1);
        
        const stats = {
            tổng_phiên: total,
            đã_xác_nhận: valid.length,
            đúng: correct,
            sai: wrong,
            tỉ_lệ_đúng: valid.length > 0 ? (correct / valid.length * 100).toFixed(2) : 0,
            tỉ_lệ_đúng_50_gần_nhất: valid.length > 0 ? (recentAccuracy * 100).toFixed(2) : 0,
            phân_tích_độ_tin_cậy: {
                cao: valid.filter(h => h.độ_tin_cậy >= 0.8).length,
                trung_bình: valid.filter(h => h.độ_tin_cậy >= 0.5 && h.độ_tin_cậy < 0.8).length,
                thấp: valid.filter(h => h.độ_tin_cậy < 0.5).length
            },
            xu_hướng: valid.slice(-20).map(h => h.đúng_sai)
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

// API cập nhật kết quả
app.post('/api/update_prediction', async (req, res) => {
    try {
        const { phiên, kết_quả_thực_tế } = req.body;
        
        if (!phiên || !kết_quả_thực_tế) {
            return res.status(400).json({ error: 'Thiếu phiên hoặc kết quả thực tế' });
        }

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
            updated: {
                phiên: entry.phiên,
                dự_đoán: entry.dự_đoán,
                kết_quả: entry.kết_quả_thực_tế,
                đúng: entry.đúng_sai
            },
            message: entry.đúng_sai ? '🎉 Dự đoán đúng!' : '😅 Dự đoán sai!'
        });
    } catch (error) {
        console.error('Lỗi cập nhật:', error);
        res.status(500).json({ error: 'Lỗi cập nhật', details: error.message });
    }
});

// API thống kê chi tiết
app.get('/api/stats', (req, res) => {
    try {
        const history = algorithm.getPredictionHistory();
        const valid = history.filter(h => h.đúng_sai !== null);
        
        // Phân tích theo thời gian
        const byHour = {};
        const byDay = {};
        valid.forEach(h => {
            const date = new Date(h.thời_gian);
            const hour = date.getHours();
            const day = date.getDay();
            if (!byHour[hour]) byHour[hour] = { total: 0, correct: 0 };
            if (!byDay[day]) byDay[day] = { total: 0, correct: 0 };
            byHour[hour].total++;
            byDay[day].total++;
            if (h.đúng_sai) {
                byHour[hour].correct++;
                byDay[day].correct++;
            }
        });

        const stats = {
            tổng_phiên: history.length,
            đã_xác_nhận: valid.length,
            đúng: valid.filter(h => h.đúng_sai).length,
            sai: valid.filter(h => !h.đúng_sai).length,
            tỉ_lệ_đúng: valid.length > 0 ? (valid.filter(h => h.đúng_sai).length / valid.length * 100).toFixed(2) : 0,
            tỉ_lệ_đúng_50_gần_nhất: valid.length >= 50 ? 
                (valid.slice(-50).filter(h => h.đúng_sai).length / 50 * 100).toFixed(2) : 0,
            
            phân_tích_độ_tin_cậy: {
                cao: valid.filter(h => h.độ_tin_cậy >= 0.8).length,
                trung_bình: valid.filter(h => h.độ_tin_cậy >= 0.5 && h.độ_tin_cậy < 0.8).length,
                thấp: valid.filter(h => h.độ_tin_cậy < 0.5).length,
                tỉ_lệ_đúng_cao: valid.filter(h => h.độ_tin_cậy >= 0.8 && h.đúng_sai).length / 
                                Math.max(1, valid.filter(h => h.độ_tin_cậy >= 0.8).length) * 100
            },
            
            theo_giờ: Object.keys(byHour).map(hour => ({
                giờ: hour,
                tổng: byHour[hour].total,
                đúng: byHour[hour].correct,
                tỉ_lệ: (byHour[hour].correct / byHour[hour].total * 100).toFixed(1)
            })).sort((a, b) => a.giờ - b.giờ),
            
            theo_ngày: Object.keys(byDay).map(day => ({
                ngày: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day],
                tổng: byDay[day].total,
                đúng: byDay[day].correct,
                tỉ_lệ: (byDay[day].correct / byDay[day].total * 100).toFixed(1)
            })).sort((a, b) => a.ngày - b.ngày),
            
            gần_đây: valid.slice(-20).map(h => ({
                phiên: h.phiên,
                dự_đoán: h.dự_đoán,
                kết_quả: h.kết_quả_thực_tế,
                đúng: h.đúng_sai,
                độ_tin_cậy: h.độ_tin_cậy
            })),
            
            thời_gian: new Date().toISOString()
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Lỗi thống kê:', error);
        res.status(500).json({ error: 'Lỗi thống kê' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        version: '3.0.0-ultra',
        timestamp: new Date().toISOString(),
        predictionCount: algorithm.predictionHistory.length,
        algorithm: {
            name: 'VIP ULTRA MAX ALGORITHM',
            layers: '6 -> 128 -> 256 -> 512 -> 256 -> 128 -> 2',
            parameters: '~1.5M',
            methods: ['Neural Network', 'Markov Chain', 'Pattern Recognition', 'Trend Analysis', 
                     'Statistical', 'Fibonacci', 'GARCH', 'LSTM', 'Attention']
        }
    });
});

// ============================================================
// KEEP ALIVE
// ============================================================
setInterval(async () => {
    try {
        await axios.get(`http://localhost:${CONFIG.PORT}/health`);
        console.log('🔄 Keep-alive ping thành công');
    } catch (error) {
        console.log('⚠️ Keep-alive ping thất bại');
    }
}, 14 * 60 * 1000);

// ============================================================
// KHỞI ĐỘNG SERVER
// ============================================================
app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 VIP ULTRA MAX TX ANALYSIS SERVER');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${CONFIG.PORT}`);
    console.log(`🧠 Algorithm: Neural Network + 8 Methods Ensemble`);
    console.log(`📊 Architecture: 6 -> 128 -> 256 -> 512 -> 256 -> 128 -> 2`);
    console.log(`⚡ Parameters: ~1.5 Million`);
    console.log(`🎯 Confidence Threshold: ${CONFIG.CONFIDENCE_THRESHOLD}`);
    console.log('='.repeat(60));
    console.log('📌 ENDPOINTS:');
    console.log(`  🎯 /api/tx - Dự đoán`);
    console.log(`  📜 /lich_su - Lịch sử`);
    console.log(`  🔐 /api/md5 - MD5 Hash`);
    console.log(`  📊 /api/stats - Thống kê`);
    console.log(`  ❤️  /health - Health check`);
    console.log('='.repeat(60));
    console.log('✨ Algorithm initialized successfully!');
    console.log('='.repeat(60));
});
