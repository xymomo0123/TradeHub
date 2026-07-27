# MOMO Finance - Stock Trading System Frontend

## 📌 Project Overview

**MOMO Finance** is a simulated stock trading platform frontend developed with **HTML5, CSS3 and JavaScript**.

The project implements a complete web-based stock trading experience, including user authentication, real-time market visualization, stock detail analysis, simulated trading, portfolio management and transaction history tracking.

The system interacts with backend APIs to simulate a real-world financial trading platform, focusing on frontend engineering practices such as asynchronous data communication, dynamic rendering, state management and interactive visualization.


## ✨ Features

- 🔐 User authentication with different access permissions
- 📈 Real-time stock market data visualization
- 🔍 Stock search and individual stock analysis
- 📊 Interactive price trend charts
- 💰 Simulated stock buying and selling system
- 📦 Portfolio management and profit/loss calculation
- 📋 Transaction history query and filtering
- 📱 Responsive user interface design


---

# 🖥️ System Preview

> Add screenshots here

Example:

```
📷 Homepage Screenshot

📷 Stock Detail Chart

📷 Trading Interface

📷 Portfolio Page
```


---

# 🚀 Core Functionalities


## 1. User Authentication System

The system supports two user modes:

| Role | Functions |
| :--- | :--- |
| Guest | Browse market data, search stocks, view stock details, register and login |
| User | Trade stocks, manage portfolio, view transaction history |


Implemented features:

- User registration
- Login verification
- Session persistence
- User identity checking


User login state is stored through:

```
sessionStorage
```


---

## 2. Real-time Market Data Display

The platform provides dynamic stock market visualization.

Supported markets:

- Shanghai Stock Exchange
- Shenzhen Stock Exchange
- ChiNext


Displayed information:

| Data | Description |
| :--- | :--- |
| Stock Code | Unique stock identifier |
| Stock Name | Stock information |
| Latest Price | Current market price |
| Change Rate | Percentage change |
| Price Change | Absolute price change |


Features:

- Automatic data refresh every 5 seconds
- Countdown display
- Color-based price movement indication

```
Red  → Price increase
Green → Price decrease
```


---

## 3. Individual Stock Analysis


Users can click a stock to view detailed information.

Implemented features:

- Stock information display
- Historical price trend visualization
- Dynamic chart updating


Technology:

- Chart.js for interactive visualization
- Real-time chart refresh
- Responsive chart rendering


---

## 4. Stock Trading System


The system simulates basic stock trading operations.

Supported operations:

- Buy stocks
- Sell stocks


Trading workflow:

```
Select Stock

      ↓

Choose Trading Type

      ↓

Input Quantity and Price

      ↓

Validate Trading Parameters

      ↓

Submit Trading Request

      ↓

Update Account Information

```


Implemented rules:

- Trading quantity must be a multiple of 100
- Automatic transaction amount calculation
- Balance verification
- Position verification


Possible transaction results:

| Status | Description |
| :--- | :--- |
| Success | Transaction completed |
| Pending | Order submitted |
| Failed | Invalid transaction |
| Insufficient Balance | Cannot complete purchase |
| Insufficient Position | Cannot complete sale |


---

## 5. Portfolio Management


Users can monitor their investment status.


Portfolio dashboard provides:

- Account balance
- Total holdings
- Total cost
- Market value
- Profit/loss statistics


Holding details:

| Field | Description |
| :--- | :--- |
| Stock Code | Stock identifier |
| Stock Name | Stock information |
| Quantity | Number of shares |
| Average Price | Purchase average price |
| Current Price | Latest market price |
| Market Value | Current asset value |
| Profit/Loss | Investment return |


---

## 6. Transaction History


Users can view historical trading records.


Information displayed:

- Transaction time
- Stock code
- Stock name
- Trading direction
- Order price
- Execution price
- Quantity
- Amount
- Transaction status


Filtering supported:

- Buy / Sell
- Transaction status


---

# 🛠️ Technology Stack


| Category | Technology |
| :--- | :--- |
| Frontend Structure | HTML5 |
| Styling | CSS3 |
| Programming Language | JavaScript ES6+ |
| DOM Manipulation | jQuery 3.6.0 |
| Data Visualization | Chart.js |
| Data Storage | sessionStorage |
| API Communication | Fetch API, AJAX |
| Development Tool | Visual Studio Code |


---

# 🏗️ Project Structure


```
project-root/

├── index.html              # Guest homepage
├── login.html              # Login page
├── register.html           # Registration page
├── user.html               # User dashboard
├── portfolio.html          # Portfolio management
├── profile.html            # User center
│
├── css/
│   ├── style.css           # Global styles
│   ├── guest.css           # Guest pages
│   ├── auth.css            # Authentication pages
│
├── js/
│   ├── main.js             # Common functions and API requests
│   ├── guest.js            # Market browsing logic
│   ├── auth.js             # Login/register logic
│   ├── user.js             # Trading logic
│   ├── portfolio.js        # Portfolio management
│   ├── profile.js          # Transaction records
│
└── README.md

```


---

# ⚙️ Implementation Highlights


## 1. Asynchronous Data Communication


The frontend communicates with backend services through:

- Fetch API
- jQuery AJAX


Implemented functions:

- Request stock data
- Submit trading operations
- Retrieve user information
- Load transaction records


---

## 2. Real-time Data Refresh Mechanism


Market data refresh:

```javascript
setInterval(loadMarketData, 5000)
```


Features:

- Periodic API requests
- Automatic UI updates
- Real-time price changes


Independent timers are used for:

- Market page refresh
- Stock detail chart refresh


to avoid asynchronous conflicts.


---

## 3. Stock Price Change Calculation


The system maintains previous market data:

```javascript
previousMarketData
```


Used for calculating:

- Price changes
- Percentage changes


This improves the accuracy of dynamic market visualization.


---

## 4. Frontend State Management


Global states include:

- Market data
- User information
- Portfolio information
- Current market selection


Common utilities are encapsulated:

- API request functions
- Number formatting
- Stock calculation functions


---

# ▶️ Run the Project


## Requirements

- Modern browser
- Running backend service


Default backend address:

```
http://127.0.0.1:12345
```


---

## Start Frontend


Option 1:

Open directly:

```
index.html
```


Option 2:

Start local server:

```bash
python -m http.server
```


Then visit:

```
http://localhost:8000
```


---

# 🌟 Project Highlights


## Real-time Financial Data Visualization

Implemented dynamic stock market updates and interactive price charts.


## Complete Trading Workflow

Simulated:

- User authentication
- Stock trading
- Asset management
- Transaction tracking


## Interactive User Experience

Implemented:

- Responsive layout
- Modal windows
- Dynamic tables
- Loading/error/empty states


## Financial Scenario Application

The project combines frontend engineering with financial application scenarios, improving understanding of data-driven web applications.


---

# 🔮 Future Improvements


## Frontend Framework Migration

Currently implemented with native JavaScript.

Future improvements:

- Vue.js / React componentization
- Reusable UI components
- Better state management


## Enhanced Error Handling

Improve:

- Network exception handling
- Timeout detection
- API validation


## Backend Integration

Future versions could introduce:

- Database storage
- Real user accounts
- More realistic trading engine


---

# 💻 Development Environment


| Item | Configuration |
| :--- | :--- |
| Operating System | Windows 11 |
| Browser | Microsoft Edge 135 |
| IDE | Visual Studio Code |
| Frontend | HTML5 / CSS3 / JavaScript |
| Visualization | Chart.js |


---

# 📄 Summary


MOMO Finance is a simulated stock trading frontend project that demonstrates the implementation of a complete financial web application.

Through this project, I practiced:

- Frontend architecture design
- API communication
- Dynamic data rendering
- Interactive visualization
- User authentication
- Financial application development


The project provides practical experience in building data-driven web systems and lays the foundation for developing more complex full-stack financial applications.
