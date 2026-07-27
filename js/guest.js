/**
 * 游客页面功能实现
 */

// 全局变量
let marketData = [];
let previousMarketData = new Map(); // 价格缓存
let currentMarket = 'sh';
let refreshInterval;
let countdownInterval;
let currentStockChart = null;
let detailRefreshInterval = null;
let detailCountdownInterval = null; // 详情页专用倒计时定时器
let currentDetailStockCode = null;
let isInitialLoad = true; // 初始加载标记

/**
 * 初始化页面
 */
function initGuestPage() {
    // 绑定事件监听器
    bindEvents();
    
    // 启动自动刷新＋初始数据加载
    startAutoRefresh();
}

/**
 * 绑定所有事件监听器
 */
function bindEvents() {
    // 市场标签切换
    document.querySelectorAll('.market-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.market-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMarket = tab.dataset.market;
            updateMarketTable();
        });
    });
    
    // 股票搜索
    document.getElementById('stock-search-btn').addEventListener('click', searchStock);
    
    // 回车键搜索
    document.getElementById('stock-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchStock();
        }
    });
    
    // 登录/注册按钮跳转
    document.getElementById('login-btn').addEventListener('click', () => {
        window.location.href = 'login.html'; 
    });

    document.getElementById('register-btn').addEventListener('click', () => {
        window.location.href = 'register.html';
    });
    
    // 使用事件委托处理详情按钮点击
    document.getElementById('market-table-body').addEventListener('click', (e) => {
        if (e.target.classList.contains('detail-btn')) {
            const stockCode = e.target.closest('tr').dataset.code;
            showStockDetail(stockCode);
        }
    });
    
    // 点击模态框遮罩关闭
    document.getElementById('stock-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    });
}

/**
 * 重新构建整个表格
 */
async function rebuildTable(filteredStocks) {
    const tbody = document.getElementById('market-table-body');
    tbody.innerHTML = '';
    
    // 批量处理股票数据
    const fragment = document.createDocumentFragment();
    
    for (const stock of filteredStocks) {
        const row = await createStockRow(stock);
        fragment.appendChild(row);
    }
    
    tbody.appendChild(fragment);
}

/**
 * 计算股票涨跌幅和涨跌额
 */
async function calculateStockChange(stock) {
    try {
        const currentPrice = stock.Price;
        const stockCode = stock.Code;
        
        console.log(`计算股票 ${stockCode} 涨跌幅: 当前价格=${currentPrice}`);
        
        // 方法1：尝试获取历史数据
        try {
            const historyData = await apiRequest('/getStockPrice', { code: stockCode });
            console.log(`股票 ${stockCode} 历史数据:`, historyData);
            
            if (historyData && Array.isArray(historyData) && historyData.length >= 2) {
                // 使用倒数第二个数据作为昨日收盘价
                const previousPrice = historyData[historyData.length - 2];
                console.log(`股票 ${stockCode}: 使用历史数据 - 当前=${currentPrice}, 昨日=${previousPrice}`);
                return calculateChange(currentPrice, previousPrice);
            }
        } catch (apiError) {
            console.warn(`股票 ${stockCode} 历史数据获取失败:`, apiError);
        }
        
        // 方法2：使用本地缓存的上次价格
        if (previousMarketData.has(stockCode)) {
            const cachedPrice = previousMarketData.get(stockCode);
            console.log(`股票 ${stockCode}: 使用缓存数据 - 当前=${currentPrice}, 缓存=${cachedPrice}`);
            return calculateChange(currentPrice, cachedPrice);
        }
        
        // 方法3：如果是第一次加载，基于股票代码生成稳定的基准价格
        console.warn(`股票 ${stockCode}: 首次加载，生成稳定基准价格`);
        return calculateChangeWithStableBaseline(currentPrice, stockCode);
        
    } catch (error) {
        console.error(`计算股票 ${stock.Code} 涨跌幅失败:`, error);
        return calculateChangeWithStableBaseline(stock.Price, stock.Code);
    }
}

/**
 * 基于股票代码生成稳定的基准价格
 * 确保同一支股票每次生成的基准价格都相同
 */
function calculateChangeWithStableBaseline(currentPrice, stockCode) {
    // 使用股票代码的数字部分作为种子，确保结果稳定
    const codeNumber = parseInt(stockCode.replace(/\D/g, '')) || 1;
    const seed = (codeNumber % 1000) / 1000; // 生成0-1之间的稳定数值
    
    // 基于种子生成稳定的因子，范围在0.95-1.05之间
    const stableFactor = 0.95 + seed * 0.1;
    const baselinePrice = currentPrice / stableFactor;
    
    console.log(`股票 ${stockCode}: 使用稳定基准 - 种子=${seed.toFixed(3)}, 因子=${stableFactor.toFixed(3)}, 基准价格=${baselinePrice.toFixed(2)}`);
    
    return calculateChange(currentPrice, baselinePrice);
}

/**
 * 创建股票行元素函数
 * 有些用于当时测试的控制台内容
 */
async function createStockRow(stock) {
    const row = document.createElement('tr');
    row.dataset.code = stock.Code;
    
    try {
        // 获取股票涨跌幅数据
        const change = await calculateStockChange(stock);
        
        console.log(`创建股票行 ${stock.Code}: 涨跌幅=${change.changePercent}%, 涨跌额=${change.changeAmount}`);
        
        // 设置行内容
        row.innerHTML = `
            <td>${stock.Code}</td>
            <td>${stock.Name}</td>
            <td>${formatNumber(stock.Price)}</td>
            <td class="${change.changePercent >= 0 ? 'price-up' : 'price-down'}">
                ${change.changePercent >= 0 ? '+' : ''}${change.changePercent}%
            </td>
            <td class="${change.changeAmount >= 0 ? 'price-up' : 'price-down'}">
                ${change.changeAmount >= 0 ? '+' : ''}${formatNumber(change.changeAmount)}
            </td>
            <td><button class="btn-detail detail-btn">查看详情</button></td>
        `;
        
    } catch (error) {
        console.error(`获取股票 ${stock.Code} 数据失败:`, error);
        // 使用默认数据填充
        row.innerHTML = `
            <td>${stock.Code}</td>
            <td>${stock.Name}</td>
            <td>${formatNumber(stock.Price)}</td>
            <td>--</td>
            <td>--</td>
            <td><button class="btn-detail detail-btn">查看详情</button></td>
        `;
    }
    
    return row;
}

/**
 * 更新单个股票行数据函数 （加了点调试信息
 */
async function updateStockRow(row, stock) {
    try {
        const change = await calculateStockChange(stock);
        const cells = row.querySelectorAll('td');
        
        console.log(`更新股票行 ${stock.Code}: 涨跌幅=${change.changePercent}%, 涨跌额=${change.changeAmount}`);
        
        // 更新价格（第3列，索引2）
        if (cells[2]) {
            cells[2].textContent = formatNumber(stock.Price);
        }
        
        // 更新涨跌幅（第4列，索引3）
        if (cells[3]) {
            cells[3].textContent = `${change.changePercent >= 0 ? '+' : ''}${change.changePercent}%`;
            cells[3].className = change.changePercent >= 0 ? 'price-up' : 'price-down';
        }
        
        // 更新涨跌额（第5列，索引4）
        if (cells[4]) {
            cells[4].textContent = `${change.changeAmount >= 0 ? '+' : ''}${formatNumber(change.changeAmount)}`;
            cells[4].className = change.changeAmount >= 0 ? 'price-up' : 'price-down';
        }
        
    } catch (error) {
        console.error(`更新股票行 ${stock.Code} 失败:`, error);
    }
}

/**
 * 启动大盘自动刷新
 */
function startAutoRefresh(interval = 5000) {
    // 清除现有定时器
    if (refreshInterval) clearInterval(refreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    
    // 立即加载一次数据
    loadMarketData();
    
    // 设置定时刷新 只更新数据，不重新加载页面
    refreshInterval = setInterval(() => {
        const modal = document.getElementById('stock-modal');
        if (!modal || modal.style.display === 'none' || modal.classList.contains('hidden')) {
            console.log('\n--- 开始自动刷新 ---');
            loadMarketData();
        }
    }, interval);
    
    // 更新倒计时显示
    let seconds = interval / 1000;
    const countdownElement = document.getElementById('refresh-countdown');
    if (countdownElement) {
        countdownElement.textContent = seconds;
        
        countdownInterval = setInterval(() => {
            seconds = seconds > 1 ? seconds - 1 : interval / 1000;
            const currentCountdownElement = document.getElementById('refresh-countdown');
            if (currentCountdownElement) {
                currentCountdownElement.textContent = seconds;
            }
        }, 1000);
    }
}

/**
 * 加载大盘数据函数（添加价格缓存）
 */
async function loadMarketData() {
    try {
        console.log('开始加载市场数据...');
        
        // 获取最新的市场数据
        const data = await apiRequest('/getMarketPrice');
        if (data && data.length > 0) {
            // 保存当前价格到缓存（作为下次的"上次价格"）
            if (marketData.length > 0) {
                marketData.forEach(stock => {
                    previousMarketData.set(stock.Code, stock.Price);
                });
            }
            
            // 更新当前市场数据
            marketData = data;
            console.log('获取到最新市场数据:', marketData.length, '支股票');
            console.log('价格缓存大小:', previousMarketData.size);
            
            // 只有在初始加载或者需要时才更新表格
            await updateMarketTable();
            
            // 标记初始加载完成
            if (isInitialLoad) {
                isInitialLoad = false;
                console.log('初始数据加载完成');
            }
        }
    } catch (error) {
        console.error('加载大盘数据失败:', error);
    }
}

/**
 * 确保切换盘时立即显示数据
 */
async function updateMarketTable() {
    const tbody = document.getElementById('market-table-body');
    if (!tbody) return;

    // 过滤当前市场的股票
    let filteredStocks = [];
    switch (currentMarket) {
        case 'sh':
            filteredStocks = marketData.filter(stock => stock.Code.startsWith('6'));
            break;
        case 'sz':
            filteredStocks = marketData.filter(stock => stock.Code.startsWith('0'));
            break;
        case 'cy':
            filteredStocks = marketData.filter(stock => stock.Code.startsWith('3'));
            break;
        default:
            filteredStocks = marketData;
    }

    console.log(`切换到 ${currentMarket} 市场，找到 ${filteredStocks.length} 支股票`);

    // 如果没有找到对应市场的股票，显示提示
    if (filteredStocks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">该市场暂无数据</td></tr>';
        return;
    }

    // 获取现有行
    const existingRows = Array.from(tbody.querySelectorAll('tr'));
    const existingCodes = existingRows.map(row => row.dataset.code);
    const newCodes = filteredStocks.map(stock => stock.Code);
    
    // 如果是初始加载、市场切换或者股票列表完全不同，重新创建表格
    if (isInitialLoad || 
        existingCodes.length === 0 || 
        existingCodes.some(code => !newCodes.includes(code)) ||
        newCodes.some(code => !existingCodes.includes(code))) {
        
        console.log('重新构建表格');
        await rebuildTable(filteredStocks);
    } else {
        // 只更新现有行的数据
        console.log('更新现有行数据');
        await updateExistingRows(filteredStocks);
    }
}

/**
 * 更新现有行的数据
 */
async function updateExistingRows(filteredStocks) {
    // 创建股票代码到数据的映射
    const stockMap = new Map();
    filteredStocks.forEach(stock => stockMap.set(stock.Code, stock));
    
    // 更新现有行
    const tbody = document.getElementById('market-table-body');
    const rows = tbody.querySelectorAll('tr');
    
    for (const row of rows) {
        const stockCode = row.dataset.code;
        const stock = stockMap.get(stockCode);
        
        if (stock) {
            await updateStockRow(row, stock);
        }
    }
}

/**
 * 搜索股票
 */
function searchStock() {
    const input = document.getElementById('stock-search-input').value.trim();
    if (!input) return;
    
    // 在现有数据中搜索
    const foundStock = marketData.find(stock => 
        stock.Code.includes(input) || stock.Name.includes(input)
    );
    
    if (foundStock) {
        showStockDetail(foundStock.Code);
        // 清空搜索框
        document.getElementById('stock-search-input').value = '';
    } else {
        alert('未找到匹配的股票，请检查股票代码或名称');
    }
}

/**
 * 显示股票详情
 */
async function showStockDetail(stockCode) {
    console.log('显示股票详情:', stockCode);
    
    try {
        // 检查 Chart 是否可用
        if (typeof Chart === 'undefined') {
            console.error('Chart.js 未正确加载');
            alert('图表库未加载，请检查网络连接');
            return;
        }
        
        // 设置当前详情页股票代码
        currentDetailStockCode = stockCode;
        
        // 销毁现有图表实例
        if (currentStockChart) {
            currentStockChart.destroy();
            currentStockChart = null;
        }
        
        // 清理所有详情页相关的定时器
        clearDetailTimers();
        
        // 获取股票历史数据
        const historyData = await apiRequest('/getStockPrice', { code: stockCode });
        console.log('获取到的历史数据:', historyData);
        
        // 查找股票信息
        const stockInfo = marketData.find(stock => stock.Code === stockCode);
        if (!stockInfo) {
            alert('未找到股票信息');
            return;
        }
        
        // 创建模态框内容
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${stockInfo.Name} (${stockCode})</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="chart-container">
                        <canvas id="stock-chart"></canvas>
                    </div>
                    <div class="refresh-notice">
                        图表将在 <span id="detail-countdown">5</span> 秒后更新
                    </div>
                </div>
            </div>
        `;
        
        // 显示模态框
        const modal = document.getElementById('stock-modal');
        modal.innerHTML = modalContent;
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
        // 绑定关闭按钮事件
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        
        // 等待DOM更新后绘制图表
        setTimeout(() => {
            currentStockChart = renderStockChart(stockCode, historyData, stockInfo);
            // 启动详情页自动刷新
            startDetailAutoRefresh(stockCode);
        }, 100);
        
    } catch (error) {
        console.error('详细错误信息:', error);
        alert('获取股票详情失败: ' + (error.message || '网络错误'));
    }
}

/**
 * 清理所有详情页相关的定时器
 */
function clearDetailTimers() {
    if (detailRefreshInterval) {
        clearInterval(detailRefreshInterval);
        detailRefreshInterval = null;
        console.log('清除详情页刷新定时器');
    }
    
    if (detailCountdownInterval) {
        clearInterval(detailCountdownInterval);
        detailCountdownInterval = null;
        console.log('清除详情页倒计时定时器');
    }
}

/**
 * 启动详情页自动刷新
 */
function startDetailAutoRefresh(stockCode, interval = 5000) {
    console.log('启动详情页自动刷新, 股票代码:', stockCode);
    
    // 清除现有的详情页定时器
    clearDetailTimers();
    
    // 设置详情页刷新定时器
    detailRefreshInterval = setInterval(async () => {
        try {
            // 检查模态框是否还在显示
            const modal = document.getElementById('stock-modal');
            if (!modal || modal.style.display === 'none' || modal.classList.contains('hidden')) {
                console.log('模态框已关闭，清除详情页定时器');
                clearDetailTimers();
                return;
            }
            
            // 重新获取股票数据
            const newHistoryData = await apiRequest('/getStockPrice', { code: stockCode });
            
            if (newHistoryData && currentStockChart) {
                // 更新图表数据
                updateStockChart(currentStockChart, newHistoryData);
                console.log('图表数据已更新:', stockCode);
            }
        } catch (error) {
            console.error('详情页刷新失败:', error);
        }
    }, interval);
    
    // 启动独立的倒计时
    startDetailCountdown(interval);
}

/**
 * 启动详情页倒计时
 */
function startDetailCountdown(interval) {
    console.log('启动详情页倒计时, 间隔:', interval);
    
    // 确保清除现有的倒计时定时器
    if (detailCountdownInterval) {
        clearInterval(detailCountdownInterval);
        detailCountdownInterval = null;
    }
    
    let seconds = Math.floor(interval / 1000);
    const detailCountdownElement = document.getElementById('detail-countdown');
    
    if (detailCountdownElement) {
        detailCountdownElement.textContent = seconds;
        
        detailCountdownInterval = setInterval(() => {
            const currentCountdownElement = document.getElementById('detail-countdown');
            
            // 检查元素是否还存在
            if (!currentCountdownElement) {
                console.log('倒计时元素不存在，清除倒计时定时器');
                clearInterval(detailCountdownInterval);
                detailCountdownInterval = null;
                return;
            }
            
            // 检查模态框是否还在显示
            const modal = document.getElementById('stock-modal');
            if (!modal || modal.style.display === 'none' || modal.classList.contains('hidden')) {
                console.log('模态框已关闭，清除倒计时定时器');
                clearInterval(detailCountdownInterval);
                detailCountdownInterval = null;
                return;
            }
            
            seconds--;
            if (seconds <= 0) {
                seconds = Math.floor(interval / 1000); // 重置倒计时
            }
            
            currentCountdownElement.textContent = seconds;
        }, 1000);
    }
}

/**
 * 更新股票图表数据
 * @param {Chart} chart 图表实例
 * @param {Array} newData 新的价格数据
 */
function updateStockChart(chart, newData) {
    if (!chart || !Array.isArray(newData)) {
        console.error('图表更新参数无效');
        return;
    }
    
    try {
        // 处理不同的数据格式
        let priceData = newData;
        if (newData.length > 0 && typeof newData[0] === 'object') {
            // 如果是对象数组，提取价格字段
            priceData = newData.map(item => item.Price || item.price || 0);
        }
        
        // 更新数据
        chart.data.datasets[0].data = priceData;
        
        // 更新时间标签 - 修改为按5秒间隔显示时分秒
        chart.data.labels = generateTimeLabels(priceData.length);
        
        // 更新颜色（根据趋势）
        const isUpTrend = priceData.length > 1 ? priceData[priceData.length - 1] >= priceData[0] : true;
        const lineColor = isUpTrend ? '#e74c3c' : '#2ecc71';
        
        chart.data.datasets[0].borderColor = lineColor;
        chart.data.datasets[0].backgroundColor = `${lineColor}20`;
        chart.data.datasets[0].pointBackgroundColor = lineColor;
        
        // 重新渲染图表
        chart.update('none'); // 使用 'none' 模式避免动画，提高性能
        
    } catch (error) {
        console.error('图表更新失败:', error);
    }
}

/**
 * 关闭模态框
 */
function closeModal() {
    console.log('关闭模态框');
    
    const modal = document.getElementById('stock-modal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
    
    // 清理图表资源
    if (currentStockChart) {
        currentStockChart.destroy();
        currentStockChart = null;
        console.log('销毁图表实例');
    }
    
    // 清理所有详情页相关的定时器
    clearDetailTimers();
    
    // 清空当前详情页股票代码
    currentDetailStockCode = null;
    console.log('模态框资源清理完成');
}

/**
 * 绘制股票走势图表
 * @param {string} stockCode 股票代码
 * @param {Array} priceData 价格数据
 * @param {Object} stockInfo 股票信息
 */
function renderStockChart(stockCode, priceData, stockInfo) {
    const canvas = document.getElementById('stock-chart');
    if (!canvas) {
        console.error('找不到画布元素');
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // 处理不同格式的价格数据
    let processedData = [];
    if (Array.isArray(priceData)) {
        if (priceData.length > 0 && typeof priceData[0] === 'number') {
            // 数字数组
            processedData = priceData;
        } else if (priceData.length > 0 && typeof priceData[0] === 'object') {
            // 对象数组，提取价格字段
            processedData = priceData.map(item => item.Price || item.price || 0);
        } else {
            // 其他情况，使用模拟数据
            processedData = [10, 12, 8, 15, 11, 9, 13, 16, 14, 18];
        }
    } else {
        console.error('价格数据格式错误:', priceData);
        // 使用模拟数据
        processedData = [10, 12, 8, 15, 11, 9, 13, 16, 14, 18];
    }
    
    // 生成时间标签
    const labels = generateTimeLabels(processedData.length);
    
    // 判断整体趋势
    const isUpTrend = processedData.length > 1 ? processedData[processedData.length - 1] >= processedData[0] : true;
    const lineColor = isUpTrend ? '#e74c3c' : '#2ecc71';
    
    // 创建图表（chart语法）
    try {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${stockCode} 走势`,
                    data: processedData,
                    borderColor: lineColor,
                    backgroundColor: `${lineColor}20`,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: lineColor,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '时间(每5秒)'
                        },
                        grid: {
                            display: true,
                            color: '#f0f0f0'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '价格 (元)'
                        },
                        grid: {
                            display: true,
                            color: '#f0f0f0'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `价格: ${formatNumber(context.parsed.y)} 元`;
                            }
                        }
                    }
                }
            }
        });
    } catch (chartError) {
        console.error('图表创建失败:', chartError);
        
        // Chart.js v2 语法
        try {
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${stockCode} 走势`,
                        data: processedData,
                        borderColor: lineColor,
                        backgroundColor: `${lineColor}20`,
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: lineColor,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    },
                    scales: {
                        xAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: '时间(每5秒)'
                            }
                        }],
                        yAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: '价格 (元)'
                            }
                        }]
                    },
                    legend: {
                        position: 'top',
                    },
                    tooltips: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(tooltipItem, data) {
                                return `价格: ${formatNumber(tooltipItem.yLabel)} 元`;
                            }
                        }
                    }
                }
            });
        } catch (v2Error) {
            console.error('Chart.js v2 语法也失败:', v2Error);
            alert('图表渲染失败，请检查 Chart.js 库是否正确加载');
            return null;
        }
    }
}

/**
 * 生成时间标签
 */
function generateTimeLabels(count) {
    const labels = [];
    const now = new Date();
    
    // 计算开始时间：当前时间减去 (count-1) * 5秒
    const startTime = new Date(now.getTime() - (count - 1) * 5 * 1000);
    
    for (let i = 0; i < count; i++) {
        // 每个数据点对应开始时间 + i * 5秒
        const time = new Date(startTime.getTime() + i * 5 * 1000);
        
        // 格式 HH:MM:SS 
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        const seconds = time.getSeconds().toString().padStart(2, '0');
        
        labels.push(`${hours}:${minutes}:${seconds}`);
    }
    
    return labels;
}

/**
 * 调试 测试服务器数据一致性
 */
async function testServerDataConsistency() {
    console.log('\n=== 服务器数据一致性测试 ===');
    
    try {
        // 获取市场数据
        const marketData1 = await apiRequest('/getMarketPrice');
        console.log('第一次获取市场数据:', marketData1.length, '支股票');
        
        // 等待1秒后再次获取
        await new Promise(resolve => setTimeout(resolve, 1000));
        const marketData2 = await apiRequest('/getMarketPrice');
        console.log('第二次获取市场数据:', marketData2.length, '支股票');
        
        // 比较前5支股票的价格变化
        for (let i = 0; i < Math.min(5, marketData1.length, marketData2.length); i++) {
            const stock1 = marketData1[i];
            const stock2 = marketData2[i];
            
            if (stock1.Code === stock2.Code) {
                const priceChange = ((stock2.Price - stock1.Price) / stock1.Price * 100).toFixed(2);
                console.log(`${stock1.Code}: ${stock1.Price} -> ${stock2.Price} (${priceChange}%)`);
            }
        }
        
        // 测试历史数据
        console.log('\n--- 历史数据测试 ---');
        const testStock = marketData1[0];
        const historyData1 = await apiRequest('/getStockPrice', { code: testStock.Code });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        const historyData2 = await apiRequest('/getStockPrice', { code: testStock.Code });
        
        console.log(`股票 ${testStock.Code} 历史数据长度: ${historyData1.length} vs ${historyData2.length}`);
        console.log('最后5个价格 (第一次):', historyData1.slice(-5));
        console.log('最后5个价格 (第二次):', historyData2.slice(-5));
        
    } catch (error) {
        console.error('服务器数据测试失败:', error);
    }
    
    console.log('=== 测试结束 ===\n');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initGuestPage();
    
    // 添加测试
    setTimeout(() => {
        testServerDataConsistency();
    }, 2000);
});