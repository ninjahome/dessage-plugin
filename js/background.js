let __walletList = null;
let __initialized = false;
console.log("plugin background service start......");
console.log(chrome.action);
chrome.runtime.onInstalled.addListener((details) => {
    console.log("onInstalled event triggered");
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
        });
    }
});

chrome.action.onClicked.addListener(() => {
    console.log("plugin clicked");
});

// chrome.action.onClicked.addListener( async () => {
//     console.log("plugin clicked");
//     if (!__initialized) {
//         console.log('Variables not initialized. Initializing now...');
//         await initDatabase();
//         const wallets = await loadLocalWallet();
//         if (!wallets || wallets.length === 0) {
//             chrome.tabs.create({
//                 url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
//             });
//         }
//         __walletList = wallets;
//         __initialized = true;
//     } else {
//         console.log('Variables already initialized.');
//     }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'currentStatus') {
        sendResponse({status: 'init'});
    }
    if (request.action === 'unlockWallet') {
        const pwd = request.password;
        __walletList.forEach(wallet => {
            wallet.decryptKey(pwd);
        })
        sendResponse({status: 'success'});
    }
});