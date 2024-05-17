// js/inject.js
(function() {
    // 设置 dessage 对象
    window.dessage = {
        version: '1.0.0',
        connect: function () {
            console.log('Connecting to Dessage...');
            // 实现连接逻辑
        },
        // 可以添加更多的方法和属性
    };

    // 您可以在这里添加更多的初始化逻辑
    console.log('Dessage injected');
})();
