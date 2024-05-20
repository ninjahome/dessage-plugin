document.addEventListener("DOMContentLoaded", initDessagePlugin);

async function initDessagePlugin() {
    await initDatabase();
    // await databaseDeleteByFilter(__tableNameWallet,(val)=>{
    //     console.log("delete all");
    //     return true;
    // })
    const wallets = await loadLocalWallet();
    if (!wallets || wallets.length === 0) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
        });
    }
    console.log("all wallets:=>",wallets);
}