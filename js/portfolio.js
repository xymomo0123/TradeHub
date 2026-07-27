/**
 * 持仓查看页面
 */

// 全局变量
let userInfo = null;
let portfolioData = [];
let marketData = [];
let refreshInterval;
let countdownInterval;

/**
 * 初始化持仓页面
 */
function initPortfolioPage() {
    try {
        checkUserLogin();
        bindPortfolioEvents();
        loadUserInfo();
        loadPortfolioData();
        startAutoRefresh();
        updateClock(); // 初始化时钟
        setInterval(updateClock, 1000); // 每秒更新时钟
    } catch (error) {
        console.error('持仓页面初始化失败:', error);
        alert('页面初始化遇到错误，请刷新重试');
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
 * 绑定持仓页面事件监听器
 */
function bindPortfolioEvents() {
    // 手动刷新按钮
    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadPortfolioData();
        loadUserInfo();
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
        } else {
            console.error('获取用户余额失败');
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
}

/**
 * 加载持仓数据
 */
async function loadPortfolioData() {
    try {
        // 显示加载状态
        showLoadingState();

        // 并行获取持仓数据和市场数据
        const [portfolioResponse, marketResponse] = await Promise.all([
            fetch(`http://127.0.0.1:12345/getInventory?username=${encodeURIComponent(userInfo.username)}`),
            fetch('http://127.0.0.1:12345/getMarketPrice')
        ]);

        const portfolioResult = await portfolioResponse.json();
        const marketResult = await marketResponse.json();

        if (Array.isArray(portfolioResult) && Array.isArray(marketResult)) {
            portfolioData = portfolioResult;
            marketData = marketResult;
            
            // 合并持仓数据和市场数据
            const enrichedPortfolio = enrichPortfolioData(portfolioData, marketData);
            
            // 更新页面显示
            updatePortfolioDisplay(enrichedPortfolio);
            updatePortfolioSummary(enrichedPortfolio);
        } else {
            console.error('持仓数据格式错误:', portfolioResult);
            showEmptyState();
        }
    } catch (error) {
        console.error('加载持仓数据失败:', error);
        showErrorState(error.message);
    }
}

/**
 * 显示加载状态
 */
function showLoadingState() {
    const tbody = document.getElementById('portfolio-table-body');
    tbody.innerHTML = '<tr><td colspan="9" class="loading">正在加载持仓数据...</td></tr>';
    
    // 隐藏空状态
    document.getElementById('empty-state').classList.add('hidden');
}

/**
 * 显示错误状态
 */
function showErrorState(errorMessage) {
    const tbody = document.getElementById('portfolio-table-body');
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #dc3545;">加载失败: ${errorMessage}</td></tr>`;
}

/**
 * 显示空状态
 */
function showEmptyState() {
    const tbody = document.getElementById('portfolio-table-body');
    tbody.innerHTML = '';
    document.getElementById('empty-state').classList.remove('hidden');
}

/**
 * 丰富持仓数据（合并一些市场数据）
 */
function enrichPortfolioData(portfolio, market) {
    return portfolio.map(position => {
        const marketInfo = market.find(stock => stock.Code === position.Code);
        const currentPrice = marketInfo ? marketInfo.Price : 0;
        const stockName = marketInfo ? marketInfo.Name : '未知股票';
        
        // 计算相关数值
        const currentMarketValue = position.Amount * currentPrice;
        const profitLoss = currentMarketValue - position.Total_Cost;
        const profitLossPercent = position.Total_Cost > 0 ? (profitLoss / position.Total_Cost) * 100 : 0;
        
        return {
            ...position,
            Name: stockName,
            CurrentPrice: currentPrice,
            CurrentMarketValue: currentMarketValue,
            ProfitLoss: profitLoss,
            ProfitLossPercent: profitLossPercent
        };
    });
}

/**
 * 更新持仓表格显示
 */
function updatePortfolioDisplay(enrichedPortfolio) {
    const tbody = document.getElementById('portfolio-table-body');
    
    if (!enrichedPortfolio || enrichedPortfolio.length === 0) {
        showEmptyState();
        return;
    }
    
    // 隐藏空状态
    document.getElementById('empty-state').classList.add('hidden');
    
    tbody.innerHTML = '';
    
    enrichedPortfolio.forEach(position => {
        const row = document.createElement('tr');
        row.dataset.code = position.Code;
        
        // 确定盈亏样式类
        let profitClass = 'profit-zero';
        let percentClass = 'zero';
        if (position.ProfitLoss > 0) {
            profitClass = 'profit-positive';
            percentClass = 'positive';
        } else if (position.ProfitLoss < 0) {
            profitClass = 'profit-negative';
            percentClass = 'negative';
        }
        
        row.innerHTML = `
            <td class="stock-code">${position.Code}</td>
            <td class="stock-name">${position.Name}</td>
            <td class="number-value">${formatNumber(position.Amount, 0)}</td>
            <td class="number-value">${formatNumber(position.AVG_Cost)}</td>
            <td class="number-value">${formatNumber(position.CurrentPrice)}</td>
            <td class="number-value">${formatNumber(position.Total_Cost)}</td>
            <td class="number-value">${formatNumber(position.CurrentMarketValue)}</td>
            <td class="number-value ${profitClass}">${formatNumber(position.ProfitLoss, 2, true)}</td>
            <td class="percentage ${percentClass}">${formatNumber(position.ProfitLossPercent, 2, true)}%</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * 更新持仓统计
 */
function updatePortfolioSummary(enrichedPortfolio) {
    if (!enrichedPortfolio || enrichedPortfolio.length === 0) {
        // 重置所有统计数据
        document.getElementById('total-positions').textContent = '0';
        document.getElementById('total-cost').textContent = '0.00';
        document.getElementById('total-market-value').textContent = '0.00';
        document.getElementById('total-profit-loss').textContent = '0.00';
        
        // 重置样式类
        document.getElementById('total-profit-loss').className = 'summary-value';
        return;
    }
    
    // 计算统计数据
    const totalPositions = enrichedPortfolio.length;
    const totalCost = enrichedPortfolio.reduce((sum, pos) => sum + pos.Total_Cost, 0);
    const totalMarketValue = enrichedPortfolio.reduce((sum, pos) => sum + pos.CurrentMarketValue, 0);
    const totalProfitLoss = totalMarketValue - totalCost;
    
    // 更新显示
    document.getElementById('total-positions').textContent = totalPositions.toString();
    document.getElementById('total-cost').textContent = formatNumber(totalCost);
    document.getElementById('total-market-value').textContent = formatNumber(totalMarketValue);
    document.getElementById('total-profit-loss').textContent = formatNumber(totalProfitLoss, 2, true);
    
    // 设置盈亏颜色
    const profitLossElement = document.getElementById('total-profit-loss');
    profitLossElement.className = 'summary-value';
    if (totalProfitLoss > 0) {
        profitLossElement.classList.add('profit');
    } else if (totalProfitLoss < 0) {
        profitLossElement.classList.add('loss');
    }
}

/**
 * 启动自动刷新
 */
function startAutoRefresh(interval = 5000) {
    if (refreshInterval) clearInterval(refreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);

    // 立即刷新一次
    loadPortfolioData();
    loadUserInfo();

    // 设置定时刷新
    refreshInterval = setInterval(() => {
        loadPortfolioData();
        loadUserInfo();
    }, interval);

    // 设置倒计时显示
    let seconds = interval / 1000;
    const countdownElement = document.getElementById('refresh-countdown');
    if (countdownElement) {
        countdownElement.textContent = seconds;

        countdownInterval = setInterval(() => {
            seconds = seconds > 1 ? seconds - 1 : interval / 1000;
            const currentCountdownElement = document.getElementById('refresh-countdown');
            if (currentCountdownElement) {
                currentCountdownElement.textContent = seconds;
            } else {
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
}

/**
 * 页面卸载时清理定时器
 */
window.addEventListener('beforeunload', () => {
    if (refreshInterval) clearInterval(refreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPortfolioPage);