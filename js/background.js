// import {loadLocalWallet} from "./wallet.js";
// import {initDatabase} from "./database.js";
// import {MsgType, WalletStatus} from "./util.js";
importScripts('database.js');
importScripts('util.js');
importScripts('crypto.bundle.js');
importScripts('wallet.js');

let __walletList = null;
let __walletStatus = WalletStatus.Init;

chrome.runtime.onInstalled.addListener((details) => {
    console.log("onInstalled event triggered");
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("action :=>", request.action);
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
            __walletStatus = WalletStatus.Init;
            sendResponse({status: 'success'})
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

async function openWallet(pwd, sendResponse) {
    try {
        __walletList.forEach(wallet => {
            wallet.decryptKey(pwd);
        })
        sendResponse({status: true, message: 'success'});
    } catch (error) {
        console.error('Error in open wallet:', error);
        sendResponse({status: false, message: error.toString()});
    }
}

async function closeWallet(sendResponse) {
    __walletList.forEach(wallet => {
        wallet.closeKey();
    })
    sendResponse({status: true, message: 'success'});
}