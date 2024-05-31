// js/inject.js
(function () {
    // 设置 dessage 对象
    window.dessage = {
        version: '1.0.0',
        connect: function () {
            console.log('Connecting to Dessage...');
            window.postMessage({ source: "dessage", action: "someAction", data: "some data" },
                "*");
            window.addEventListener("message", (event) => {
                if (event.source !== window || !event.data || event.data.source !== "dessage-response") {
                    return;
                }
                console.log("Response from background:", event.data.result);
            });
        },
    };
    console.log('Dessage injected');
})();
