/**
 * 全局工具函数和变量
 */

// API基础URL
const API_BASE = 'http://127.0.0.1:12345';

/**
 * 封装AJAX请求
 * @param {string} endpoint API端点
 * @param {object} params 请求参数
 * @param {string} method 请求方法
 * @returns {Promise} 返回Promise对象
 */
function apiRequest(endpoint, params = {}, method = 'GET') {
    return new Promise((resolve, reject) => {
        let url = `${API_BASE}${endpoint}`;
        if (method === 'GET' && Object.keys(params).length > 0) {
            url += '?' + new URLSearchParams(params).toString();
        }
        
        $.ajax({
            url: url,
            method: method,
            dataType: 'json',
            data: method !== 'GET' ? JSON.stringify(params) : null,
            success: resolve,
            error: (xhr, status, error) => {
                console.error('API Error:', status, error);
                reject({status: xhr.status, message: error});
            }
        });
    });
}

/**
 * 格式化数字为保留两位小数
 * @param {number} num 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
function formatNumber(num) {
    return parseFloat(num).toFixed(2);
}

/**
 * 计算涨跌幅
 * @param {number} current 当前价格
 * @param {number} previous 前一个价格
 * @returns {object} 包含涨跌幅和涨跌额的对象
 */
function calculateChange(current, previous) {
    if (!previous || previous === 0) return { changePercent: 0, changeAmount: 0 };
    
    const changeAmount = current - previous;
    const changePercent = (changeAmount / previous) * 100;
    
    return {
        changePercent: formatNumber(changePercent),
        changeAmount: formatNumber(changeAmount)
    };
}

/**
 * 初始化实时时钟
 */
function initRealTimeClock() {
    function updateClock() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        const timeStr = now.toLocaleTimeString('zh-CN');
        
        const clockElement = document.getElementById('real-time-clock');
        if (clockElement) {
            clockElement.textContent = `${dateStr} ${timeStr}`;
        }
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// 页面加载完成后初始化时钟
document.addEventListener('DOMContentLoaded', initRealTimeClock);