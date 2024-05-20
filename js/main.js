document.addEventListener("DOMContentLoaded", initDessagePlugin);

async function initDessagePlugin() {
    await initDatabase();

    const wallets = await loadLocalWallet();
    console.log("all wallets:=>",wallets);
    // if (!wallets || wallets.length === 0) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
        });
    // }
}

async function testRemoveAllWallet() {
    await databaseDeleteByFilter(__tableNameWallet, (val) => {
        console.log("delete all");
        return true;
    })
}