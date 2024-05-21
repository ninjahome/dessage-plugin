document.addEventListener("DOMContentLoaded", initDessagePlugin);
let __walletList = null;

async function initDessagePlugin() {
    await initDatabase();

    const wallets = await loadLocalWallet();
    console.log("all wallets:=>", wallets);
    // if (!wallets || wallets.length === 0) {
    chrome.tabs.create({
        url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
    });
    // }

    __walletList = wallets;
}

function openAllWallets(pwd) {
    if (!__walletList || __walletList.length === 0) {
        return;
    }

    __walletList.forEach(wallet=>{
        wallet.decryptKey(pwd);
    })
}

async function testRemoveAllWallet() {
    await databaseDeleteByFilter(__tableNameWallet, (val) => {
        console.log("delete all");
        return true;
    })
}