document.addEventListener("DOMContentLoaded", initDessagePlugin);

async function initDessagePlugin() {
    await initDatabase();

    const wallets = loadLocalWallet();
    if (!wallets){
        chrome.tabs.create({
            url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
        });
    }
}