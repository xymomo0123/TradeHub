/*登录注册认证逻辑*/

$(document).ready(function() {
    console.log('auth.js已加载');
    initRealTimeClock(); // 初始化时钟（与首页保持一致）

    // 登录表单提交事件
    if (document.getElementById('login-form')) {
        $('#login-form').submit(async function(e) {
            e.preventDefault();
            // 1.提取并验证输入数据
            const username = $('#username').val().trim();
            const password = $('#password').val().trim();

            if (!username || !password) {
                alert('请输入账号和密码');
                return;
            }

            try {
                // 2.调用登录接口
                const result = await apiRequest('/login', { username, pwd: password });
                //3.
                if (result) {
                    // 3.1初始化用户信息
                    const userInfo = {
                        username: username,
                        balance: 1000000 // 默认余额，后续会通过接口刷新
                    };
                    //3.2 使用sessionStorage持久化用户状态
                    sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
                    
                    alert('登录成功！');
                    // 3.3 交互反馈与页面跳转
                    // 跳转到登录用户主页
                    window.location.href = 'user.html';
                } else {
                    alert('登录失败！用户名或密码错误');
                }
            } catch (error) {
                console.error('登录出错:', error);
                alert('登录时发生错误，请稍后重试');
            }
        });
    }

    // 注册表单提交事件
    if (document.getElementById('register-form')) {
        // 1. 提取并验证输入数据
        $('#register-form').submit(async function(e) {
            e.preventDefault();
            const username = $('#username').val().trim();
            const password = $('#password').val().trim();
            const confirmPassword = $('#confirm-password').val().trim();
             // 1.1 非空验证
            if (!username || !password || !confirmPassword) {
                alert('请填写所有字段');
                return;
            }
            // 1.2 密码一致性验证
            if (password !== confirmPassword) {
                alert('两次输入的密码不一致');
                return;
            }
            // 2. 调用后端注册接口
            try {
                const result = await apiRequest('/regist', { username, pwd: password });
                if (result) {
                    alert('注册成功！默认账户余额：1000000元');
                    window.location.href = 'login.html'; // 注册成功后跳转登录页
                } else {
                    alert('该用户已存在，请前往登录！');
                }
            } catch (error) {
                console.error('注册出错:', error);
                alert('注册时发生错误，请稍后重试');
            }
        });
    }
});

// 复用 main.js 中的 apiRequest 函数