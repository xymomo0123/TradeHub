/**
 * 个人界面
 */

// 全局变量
let userInfo = null;
let tradeRecords = [];
let marketData = [];
let filteredRecords = [];

/**
 * 页面初始化
 */
async function initProfilePage() {
    try {
        checkUserLogin();// 验证登录状态
        bindProfileEvents();// 绑定页面事件
        
        // 启动时钟
        updateClock();
        setInterval(updateClock, 1000);
        
        // 确保按正确顺序加载数据
        await loadInitialData();
        
    } catch (error) {
        console.error('我的页面初始化失败:', error);
        alert('页面初始化遇到错误，请刷新重试');
    }
}

/**
 * 加载初始数据 
 */
async function loadInitialData() {
    try {
        // 显示加载状态
        showLoadingRecords();
        
        // 并行加载用户信息和市场数据
        console.log('开始加载用户信息和市场数据...');
        await Promise.all([
            loadUserInfo(),
            loadMarketData()
        ]);
        
        console.log('用户信息和市场数据加载完成，开始加载交易记录...');
        console.log('市场数据条数:', marketData.length);
        
        // 确保市场数据加载完成后再加载交易记录
        await loadTradeRecords();
        
    } catch (error) {
        console.error('加载初始数据失败:', error);
        showErrorRecords(error.message);
    }
}

/**
 * 检查用户登录状态
 */
function checkUserLogin() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        alert('请先登录');
        window.location.href = 'login.html';
        return;
    }
    userInfo = JSON.parse(currentUser);
}

/**
 * 绑定事件监听器
 */
function bindProfileEvents() {
    // 注销按钮
    document.getElementById('logout-btn').addEventListener('click', showLogoutModal);
    
    // 注销模态框按钮
    document.getElementById('confirm-logout-btn').addEventListener('click', performLogout);
    document.getElementById('cancel-logout-btn').addEventListener('click', hideLogoutModal);
    
    // 刷新记录按钮
    document.getElementById('refresh-records-btn').addEventListener('click', async () => {
        try {
            await loadTradeRecords();
        } catch (error) {
            console.error('刷新交易记录失败:', error);
        }
    });
    
    // 筛选控件
    document.getElementById('direction-filter').addEventListener('change', applyFilters);
    document.getElementById('state-filter').addEventListener('change', applyFilters);
    
    // 模态框背景点击关闭
    document.getElementById('logout-modal').addEventListener('click', (e) => {
        if (e.target.id === 'logout-modal') {
            hideLogoutModal();
        }
    });
}

/**
 * 更新时钟显示
 */
function updateClock() {
    const now = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    
    const timeString = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate().toString().padStart(2, '0')}日${weekday} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const clockElement = document.getElementById('real-time-clock');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

/**
 * 加载用户信息
 */
async function loadUserInfo() {
    try {
        const response = await fetch(`http://127.0.0.1:12345/getBalance?username=${encodeURIComponent(userInfo.username)}`);
        const balance = await response.json();
        
        if (balance !== -1) {
            document.getElementById('username-display').textContent = userInfo.username;
            document.getElementById('balance-display').textContent = formatNumber(balance);
            userInfo.balance = balance;
            sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
            console.log('用户信息加载成功, 余额:', balance);
        } else {
            console.error('获取用户余额失败');
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
        throw error;
    }
}

/**
 * 加载市场数据（用于获取股票名称）
 */
async function loadMarketData() {
    try {
        const response = await fetch('http://127.0.0.1:12345/getMarketPrice');
        const data = await response.json();
        
        if (Array.isArray(data)) {
            marketData = data;
            console.log('市场数据加载成功, 股票数量:', marketData.length);
        } else {
            console.warn('市场数据格式异常:', data);
            marketData = []; // 确保为数组
        }
    } catch (error) {
        console.error('加载市场数据失败:', error);
        marketData = []; // 失败时设置为空数组，避免后续错误
        throw error;
    }
}

/**
 * 加载交易记录
 */
async function loadTradeRecords() {
    try {
        // 显示加载状态
        showLoadingRecords();
        
        // 确保市场数据已加载
        if (!Array.isArray(marketData)) {
            console.log('市场数据未就绪，重新加载...');
            await loadMarketData();
        }
        
        const response = await fetch(`http://127.0.0.1:12345/getTradeRecord?username=${encodeURIComponent(userInfo.username)}`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            tradeRecords = data;
            filteredRecords = [...tradeRecords];
            
            console.log('交易记录加载成功, 记录数量:', tradeRecords.length);
            
            // 更新统计信息
            updateAccountStats(tradeRecords);
            
            // 更新交易记录表格
            updateTradeRecordsTable(filteredRecords);
        } else {
            console.error('交易记录数据格式错误:', data);
            showEmptyRecords();
        }
    } catch (error) {
        console.error('加载交易记录失败:', error);
        showErrorRecords(error.message);
        throw error;
    }
}

/**
 * 显示加载状态
 */
function showLoadingRecords() {
    const tbody = document.getElementById('trade-records-body');
    tbody.innerHTML = '<tr><td colspan="10" class="loading-records">正在加载交易记录...</td></tr>';
    
    // 隐藏空状态
    document.getElementById('empty-records').classList.add('hidden');
}

/**
 * 显示错误状态
 */
function showErrorRecords(errorMessage) {
    const tbody = document.getElementById('trade-records-body');
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 2rem; color: #dc3545;">加载失败: ${errorMessage}</td></tr>`;
}

/**
 * 显示空状态
 */
function showEmptyRecords() {
    const tbody = document.getElementById('trade-records-body');
    tbody.innerHTML = '';
    document.getElementById('empty-records').classList.remove('hidden');
}

/**
 * 更新账户统计信息
 */
function updateAccountStats(records) {
    if (!Array.isArray(records)) {
        records = [];
    }
    
    const totalTrades = records.length;
    const successfulTrades = records.filter(record => record.State === 2).length;
    const pendingTrades = records.filter(record => record.State === 1).length;
    
    // 获取最近交易时间
    let lastTradeDate = '-';
    if (records.length > 0) {
        const sortedRecords = records.sort((a, b) => new Date(b.TradeTime) - new Date(a.TradeTime));
        const lastTrade = sortedRecords[0];
        lastTradeDate = new Date(lastTrade.TradeTime).toLocaleDateString('zh-CN');
    }
    
    // 更新统计显示
    document.getElementById('total-trades').textContent = totalTrades.toString();
    document.getElementById('successful-trades').textContent = successfulTrades.toString();
    document.getElementById('pending-trades').textContent = pendingTrades.toString();
    document.getElementById('last-trade-date').textContent = lastTradeDate;
}

/**
 * 更新交易记录表格
 */
function updateTradeRecordsTable(records) {
    const tbody = document.getElementById('trade-records-body');
    
    if (!Array.isArray(records) || records.length === 0) {
        showEmptyRecords();
        return;
    }
    
    // 隐藏空状态
    document.getElementById('empty-records').classList.add('hidden');
    
    tbody.innerHTML = '';
    
    // 按时间倒序排列
    const sortedRecords = records.sort((a, b) => new Date(b.TradeTime) - new Date(a.TradeTime));
    
    sortedRecords.forEach(record => {
        const row = document.createElement('tr');
        
        // 获取股票名称
        const stockInfo = marketData.find(stock => stock.Code === record.Code);
        let stockName = record.Code; // 默认显示股票代码
        
        if (stockInfo && stockInfo.Name) {
            stockName = stockInfo.Name;
        } else {
            console.log(`未找到股票 ${record.Code} 的名称信息`);
        }
        
        // 交易方向
        const direction = record.Direction === 0 ? '买入' : '卖出';
        const directionClass = record.Direction === 0 ? 'direction-buy' : 'direction-sell';
        
        // 交易状态
        const statusInfo = getTradeStatusInfo(record.State);
        
        // 成交金额
        const knockAmount = record.KnockPrice * record.Amount;
        
        // 格式化交易时间
        const tradeTime = new Date(record.TradeTime).toLocaleString('zh-CN');
        
        row.innerHTML = `
            <td class="trade-time">${tradeTime}</td>
            <td class="stock-code">${record.Code}</td>
            <td class="stock-name" title="${stockName}">${stockName}</td>
            <td><span class="trade-direction ${directionClass}">${direction}</span></td>
            <td class="price-value">${formatNumber(record.Price)}</td>
            <td class="price-value">${formatNumber(record.KnockPrice)}</td>
            <td class="amount-value">${formatNumber(record.Amount, 0)}</td>
            <td class="price-value">${formatNumber(knockAmount)}</td>
            <td><span class="trade-status ${statusInfo.class}">${statusInfo.text}</span></td>
            <td class="trade-no" title="${record.No}">${record.No}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * 获取交易状态信息
 */
function getTradeStatusInfo(state) {
    const statusMap = {
        0: { text: '错误', class: 'status-failed' },
        1: { text: '委托成功', class: 'status-pending' },
        2: { text: '交易成功', class: 'status-success' },
        3: { text: '废单', class: 'status-failed' },
        4: { text: '余额不足', class: 'status-failed' },
        5: { text: '持仓不足', class: 'status-failed' }
    };
    
    return statusMap[state] || { text: '未知状态', class: 'status-failed' };
}

/**
 * 筛选
 */
function applyFilters() {
    const directionFilter = document.getElementById('direction-filter').value;
    const stateFilter = document.getElementById('state-filter').value;
    
    filteredRecords = tradeRecords.filter(record => {
        let matchDirection = true;
        let matchState = true;
        
        if (directionFilter !== '') {
            matchDirection = record.Direction.toString() === directionFilter;
        }
        
        if (stateFilter !== '') {
            matchState = record.State.toString() === stateFilter;
        }
        
        return matchDirection && matchState;
    });
    
    updateTradeRecordsTable(filteredRecords);
}

/**
 * 显示注销确认模态框
 */
function showLogoutModal() {
    const modal = document.getElementById('logout-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

/**
 * 隐藏注销确认模态框
 */
function hideLogoutModal() {
    const modal = document.getElementById('logout-modal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
}

/**
 * 执行注销操作
 */
async function performLogout() {
    try {
        // 禁用按钮防止重复点击
        const confirmBtn = document.getElementById('confirm-logout-btn');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.textContent = '注销中...';
        
        // 调用注销接口
        const response = await fetch(`http://127.0.0.1:12345/logout?username=${encodeURIComponent(userInfo.username)}`);
        const result = await response.json();
        
        console.log('注销结果:', result);
        
        // 清除本地存储的用户信息
        sessionStorage.removeItem('currentUser');
        
        // 隐藏模态框
        hideLogoutModal();
        
        // 跳转到游客界面
        alert('注销成功！即将返回游客界面');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('注销失败:', error);
        alert('注销失败: ' + error.message);
        
        // 恢复按钮状态
        const confirmBtn = document.getElementById('confirm-logout-btn');
        confirmBtn.disabled = false;
        confirmBtn.textContent = '确认注销';
    }
}

/**
 * 格式化数字显示
 */
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) {
        return '0.00';
    }
    
    return parseFloat(num).toLocaleString('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initProfilePage);