importScripts('database.js');
importScripts('util.js');
importScripts('crypto.bundle.js');
importScripts('tweetnacl.bundle.js');
importScripts('base58.js');
importScripts('elliptic.bundle.js');
importScripts('bip39.browser.js');
importScripts('bech32.bundle.js');
importScripts('ethereumjs-util.bundle.js');
importScripts('wallet.js');

let __walletList = null;
let __walletStatus = WalletStatus.Init;
let __lastInterActTime = Date.now() ;
const __timeOut = 6 * 60 * 60 * 1000;
const __alarmName = 'keepActive';

chrome.runtime.onInstalled.addListener((details) => {
    console.log("onInstalled event triggered");
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
        });
        return;
    }
    chrome.alarms.create(__alarmName, { periodInMinutes: 10 });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create(__alarmName, { periodInMinutes: 10 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === __alarmName) {
        console.log('Alarm triggered to keep the service worker active.');
        if(__lastInterActTime + __timeOut > Date.now()){
            return;
        }
        clearKeepActiveAlarm();
    }
});

function clearKeepActiveAlarm() {
    chrome.alarms.clear(__alarmName, (wasCleared) => {
        if (wasCleared) {
            console.log('keepActive alarm has been cleared.');
        } else {
            console.log('Failed to clear keepActive alarm or it does not exist.');
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("action :=>", request.action);
    __lastInterActTime = Date.now();
    switch (request.action) {
        case MsgType.PluginClicked:
            pluginClicked(sendResponse).then(r => {
            });
            return true;
        case MsgType.WalletOpen:
            openWallet(request.password, sendResponse).then(r => {
            });
            return true;
        case MsgType.WalletClose:
            closeWallet().then(r => {
            });
            return true;
        case MsgType.WalletCreated:
            createWallet(sendResponse).then(r => {
            });

            return true;
        default:
            sendResponse({status: 'unknown action'});
            return false;
    }
});

async function pluginClicked(sendResponse) {
    try {
        if (__walletStatus === WalletStatus.Init) {
            await initDatabase();
            const wallets = await loadLocalWallet();
            console.log("wallet length=>", wallets.length);
            if (!wallets || wallets.length === 0) {
                __walletStatus = WalletStatus.NoWallet;
            } else {
                __walletList = wallets;
                __walletStatus = WalletStatus.Locked;
            }
        }
        sendResponse({status: __walletStatus});
    } catch (error) {
        console.error('Error in pluginClicked:', error);
        sendResponse({status: WalletStatus.Error, message: error.toString()});
    }
}

async function createWallet(sendResponse) {
    __walletStatus = WalletStatus.Init;
    sendResponse({status: 'success'})
}

async function openWallet(pwd, sendResponse) {
    try {
        __walletList.forEach(wallet => {
            wallet.decryptKey(pwd);
        })
        __walletStatus = WalletStatus.Unlocked;
        sendResponse({status: true, message: 'success'});
    } catch (error) {
        console.error('Error in open wallet:', error);
        let msg = error.toString();
        if (msg.includes("Malformed")) {
            msg = "invalid password";
        }
        sendResponse({status: false, message: msg});
    }
}

async function closeWallet(sendResponse) {
    __walletList.forEach(wallet => {
        wallet.closeKey();
    })
    __walletStatus = WalletStatus.Locked;
    sendResponse({status: true, message: 'success'});
}