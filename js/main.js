document.addEventListener("DOMContentLoaded", initDessagePlugin);

async function initDessagePlugin() {
    await initDatabase();
    initLoginDiv();
    queryStatus();
}

function queryStatus() {
    const request = {action: 'currentStatus'};
    chrome.runtime.sendMessage(request, response => {
        console.log(response);
        if (response.status === 'success') {
            console.log('Wallet unlocked');
        }
    });
}

function initLoginDiv() {
    document.querySelector(".login-container .primary-button").addEventListener('click', openAllWallets);
}

function openAllWallets() {
    chrome.runtime.sendMessage({action: 'unlockWallet', password}, response => {
        if (response.status === 'success') {
            console.log('Wallet unlocked');
        }
    });

    const password = document.querySelector(".login-container input").value;
    chrome.runtime.sendMessage({action: 'unlockWallet', password}, response => {
        if (response.status === 'success') {
            console.log('Wallet unlocked');
            showView('#onboarding/dashboard');
            return;
        }
        const errTips = document.querySelector(".login-container .login-error");
        errTips.innerText = response.status;
    });
}

async function testRemoveAllWallet() {
    await databaseDeleteByFilter(__tableNameWallet, (val) => {
        console.log("delete all");
        return true;
    })
}