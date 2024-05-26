import {__tableNameWallet, databaseDeleteByFilter} from "./database.js";
import {showView} from "./util.js";

document.addEventListener("DOMContentLoaded", initDessagePlugin);

async function initDessagePlugin() {
    initLoginDiv();
    pluginClicked();
}

function pluginClicked() {
    const request = {action: 'openPlugin'};
    chrome.runtime.sendMessage(request, response => {
        if (!response) {
            console.error('Error: Response is undefined or null.');
            return;
        }
        console.log(JSON.stringify(response));
        console.log(response.status);
        if (response.status === 'noWallet') {
            chrome.tabs.create({
                url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
            });
            return;
        }

        if (response.status === 'locked' || response.status === 'expired') {
            showView('#onboarding/unlock-plugin', router);
            return;
        }

        if (response.status === 'unlocked') {
            showView('#onboarding/dashboard', router);
            return;
        }
    });
}

function initLoginDiv() {
    document.querySelector(".login-container .primary-button").addEventListener('click', openAllWallets);
}

function openAllWallets() {

    const password = document.querySelector(".login-container input").value;
    chrome.runtime.sendMessage({action: 'unlockWallet', password}, response => {
        if (response.status === 'success') {
            console.log('Wallet unlocked');
            showView('#onboarding/dashboard', router);
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

function router(path) {
    if (path === '#onboarding/recovery-phrase') {
    }
    if (path === '#onboarding/confirm-recovery') {
    }
    if (path === '#onboarding/import-wallet') {
    }
    if (path === '#onboarding/account-home') {
    }
}