
function initLoginDiv() {
    document.querySelector(".login-container .primary-button").addEventListener('click', openAllWallets);
}
function openAllWallets() {
    const password = document.querySelector(".login-container input").value;
    chrome.runtime.sendMessage({action: MsgType.WalletOpen, password: password}, response => {
        if (response.status) {
            const obj = JSON.parse(response.message);
            __walletMap = new Map(Object.entries(obj));
            showView('#onboarding/dashboard', router);
            console.log("------------>>>", response.message, obj, __walletMap.size, __walletMap instanceof Map);
            return;
        }
        const errTips = document.querySelector(".login-container .login-error");
        errTips.innerText = response.message;
    });
}