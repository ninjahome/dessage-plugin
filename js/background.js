import {loadLocalWallet} from "./wallet.js";
import {initDatabase} from "./database.js";

let __walletList = null;
let __initialized = 0;

chrome.runtime.onInstalled.addListener((details) => {
    console.log("onInstalled event triggered");
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
        });
    }
});

chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    if (request.action === 'openPlugin') {
        pluginClicked(sendResponse).catch(error => {
            console.error('Error in pluginClicked:', error);
            sendResponse({status: 'error', message: error.toString()});
        });
        return true; // Keep the message channel open for async response
    } else if (request.action === 'unlockWallet') {
        openWallet(request.password, sendResponse);
        return true; // Keep the message channel open for async response
    } else {
        sendResponse({status: 'unknown action'});
        return false; // Close the message channel for non-async response
    }
});

async function pluginClicked() {
    switch (__initialized) {
        case 0:
            await initDatabase();
            const wallets = await loadLocalWallet();
            if (!wallets || wallets.length === 0) {
                return 'noWallet';
            }
            __walletList = wallets;
            __initialized = 1;
            return 'locked';
        case 1:
            return 'locked';
        case 2:
            return 'unlocked';
        case 3:
            return 'expired';
        default:
            return 'unknown';
    }
}


function openWallet(pwd, sendResponse) {
    try {
        __walletList.forEach(wallet => {
            wallet.decryptKey(pwd);
        })
        sendResponse({status: 'success'});
    } catch (err) {
        sendResponse({status: 'failed', error: err.toString()});
    }
}