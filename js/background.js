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

const __timeOut = 6 * 60 * 60 * 1000;
const INFURA_PROJECT_ID = 'eced40c03c2a447887b73369aee4fbbe';
const __key_wallet_status = '__key_wallet_status';
const __key_wallet_map = '__key_wallet_map';
const __key_last_touch = '__key_last_touch';
const __alarm_name__ = '__alarm_name__timer__';

async function sessionSet(key, value) {
    try {
        await chrome.storage.session.set({[key]: value});
        console.log("Value was set successfully.", value);
    } catch (error) {
        console.error("Failed to set value:", error);
    }
}

async function sessionGet(key) {
    try {
        const result = await chrome.storage.session.get([key]);
        console.log("Value is:", result[key]);
        return result[key];
    } catch (error) {
        console.error("Failed to get value:", error);
        return null;
    }
}

async function sessionRemove(key) {
    try {
        await chrome.storage.session.remove([key]);
        console.log("Value was removed successfully.");
    } catch (error) {
        console.error("Failed to remove value:", error);
    }
}

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    createAlarm().then(r => {
    });
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

async function createAlarm() {
    const alarm = await chrome.alarms.get(__alarm_name__);
    if (typeof alarm === 'undefined') {
        chrome.alarms.create(__alarm_name__, {
            periodInMinutes: 1
        });
    }
}

chrome.alarms.onAlarm.addListener(timerTaskWork);

chrome.runtime.onInstalled.addListener((details) => {
    console.log("onInstalled event triggered");
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
        });
    }
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Service Worker onStartup...');
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
            createWallet(sendResponse).then(r => {
            });
            return true;
        default:
            sendResponse({status: 'unknown action'});
            return false;
    }
});

async function timerTaskWork(alarm) {
    let walletStatus = await sessionGet(__key_wallet_status) || WalletStatus.Init;
    let keyLastTouch = await sessionGet(__key_last_touch) || 0;

    if (alarm.name === __alarm_name__) {
        console.log("Alarm Triggered!");
        if (walletStatus === WalletStatus.Unlocked) {
            queryBalance();
        }

        if (keyLastTouch + __timeOut < Date.now()){
           await closeWallet();
        }
    }
}

const ETH_ADDRESS = '0x2ba4E30628742E55e98E4a5253B510f5f2c60219';

function queryBalance() {
    console.log('start to query eth balance');
    // fetch(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`, {
    fetch(`https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [ETH_ADDRESS, 'latest'],
            id: 1
        })
    }).then(response => response.json())
        .then(result => {
            if (result.error) {
                console.error('Error:', result.error.message);
            } else {
                const balanceInWei = result.result;
                const balanceInEth = parseInt(balanceInWei, 16) / (10 ** 18);
                console.log(`Address: ${ETH_ADDRESS}`);
                console.log(`Balance: ${balanceInEth} ETH`);
            }
        })
        .catch(error => {
            console.error('Ping failed:', error);
        });
}

async function pluginClicked(sendResponse) {
    try {
        let msg = '';
        let walletStatus = await sessionGet(__key_wallet_status) || WalletStatus.Init;
        if (walletStatus === WalletStatus.Init) {
            await initDatabase();
            const wallets = await loadLocalWallet();
            // console.log("wallet length=>", wallets.length);
            if (!wallets || wallets.length === 0) {
                walletStatus = WalletStatus.NoWallet;
            } else {
                walletStatus = WalletStatus.Locked;
            }
        }

        if (walletStatus === WalletStatus.Unlocked) {
            const sObj = await sessionGet(__key_wallet_map);
            const outerWallet = new Map(sObj);
            console.log("outerWallet",outerWallet);
            const obj = Object.fromEntries(outerWallet);
            msg = JSON.stringify(obj);
        }

        sendResponse({status: walletStatus, message: msg});
        await sessionSet(__key_wallet_status, walletStatus);

    } catch (error) {
        console.error('Error in pluginClicked:', error);
        sendResponse({status: WalletStatus.Error, message: error.toString()});
    }
}

async function createWallet(sendResponse) {
    await sessionSet(__key_wallet_status, WalletStatus.Init);
    sendResponse({status: 'success'});
}

async function openWallet(pwd, sendResponse) {
    try {
        const outerWallet = new Map();

        const wallets = await loadLocalWallet();
        wallets.forEach(wallet => {
            wallet.decryptKey(pwd);
            const key = wallet.key;
            const w = new OuterWallet(wallet.address, key.BtcAddr,
                key.EthAddr, key.NostrAddr, key.BtcTestAddr);
            outerWallet.set(wallet.address, w);
        })

        await sessionSet(__key_wallet_status, WalletStatus.Unlocked);
        await sessionSet(__key_wallet_map, Array.from(outerWallet.entries()));
        console.log("outerWallet",outerWallet);
        await sessionSet(__key_last_touch, Date.now());

        const obj = Object.fromEntries(outerWallet);
        sendResponse({status: true, message: JSON.stringify(obj)});
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
    await sessionRemove(__key_wallet_map);
    await sessionSet(__key_wallet_status, WalletStatus.Locked);
    sendResponse({status: true, message: 'success'});
}