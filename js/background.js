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


self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    // 在安装时执行的逻辑
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

// self.addEventListener('fetch', (event) => {
//     event.respondWith(
//         caches.match(event.request).then((response) => {
//             return response || fetch(event.request);
//         })
//     );
// });


let __walletList = null;
let __walletStatus = WalletStatus.Init;
let __lastInterActTime = Date.now();
const __timeOut = 6 * 60 * 60 * 1000;
const __alarmName = 'keepActive';
const __alarmTimer = 1;
const __intervalTimer = 29 * 1000; // 每30秒触发一次 keepAlive
let __outerWallets = new Map();

let keepAliveInterval = null;
function startKeepAliveInterval() {
    if (keepAliveInterval === null) {
        keepAliveInterval = setInterval(keepAlive, __intervalTimer);
    }
}

function clearKeepAliveInterval() {
    if (keepAliveInterval !== null) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
}

function setKeepActiveAlarm() {
    __lastInterActTime = Date.now();
    chrome.alarms.create(__alarmName, {periodInMinutes: __alarmTimer}); // 每5分钟触发一次
}
function clearKeepActiveAlarm() {
    chrome.alarms.clear(__alarmName, (wasCleared) => {
        if (wasCleared) {
            console.log('keepActive alarm has been cleared.');
        } else {
            console.log('Failed to clear keepActive alarm or it does not exist.');
        }
    });
}

const INFURA_PROJECT_ID = 'eced40c03c2a447887b73369aee4fbbe'; // 替换为你的 Infura 项目ID
const ETH_ADDRESS = '0x2ba4E30628742E55e98E4a5253B510f5f2c60219'; // 替换为你想查询的以太坊地址

function keepAlive() {
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


chrome.runtime.onInstalled.addListener((details) => {
    console.log("onInstalled event triggered");
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
        });
        return;
    }
    setKeepActiveAlarm();
    startKeepAliveInterval();
});

chrome.runtime.onStartup.addListener(() => {
    setKeepActiveAlarm();
    startKeepAliveInterval();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === __alarmName) {
        console.log('Alarm triggered to keep the service worker active.');
        if (__lastInterActTime + __timeOut > Date.now()) {
            console.log('Interaction within timeout period. Keeping active.');
            setKeepActiveAlarm();
            startKeepAliveInterval();
            return;
        }
        clearKeepActiveAlarm();
        clearKeepAliveInterval();
    }
});



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("action :=>", request.action);
    setKeepActiveAlarm();
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
        let msg = '';
        if (__walletStatus === WalletStatus.Init) {
            await initDatabase();
            const wallets = await loadLocalWallet();
            // console.log("wallet length=>", wallets.length);
            if (!wallets || wallets.length === 0) {
                __walletStatus = WalletStatus.NoWallet;
            } else {
                __walletList = wallets;
                __walletStatus = WalletStatus.Locked;
            }
        }

        if (__walletStatus === WalletStatus.Unlocked) {
            const obj = Object.fromEntries(__outerWallets);
            msg = JSON.stringify(obj);
        }
        sendResponse({status: __walletStatus, message: msg});
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
        __outerWallets.clear();
        __walletList.forEach(wallet => {
            wallet.decryptKey(pwd);
            const key = wallet.key;
            const w = new OuterWallet(wallet.address, key.BtcAddr,
                key.EthAddr, key.NostrAddr, key.BtcTestAddr);
            __outerWallets.set(wallet.address, w);
        })
        __walletStatus = WalletStatus.Unlocked;
        const obj = Object.fromEntries(__outerWallets);
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
    __walletList.forEach(wallet => {
        wallet.closeKey();
    });
    __walletStatus = WalletStatus.Locked;
    __outerWallets.clear();
    sendResponse({status: true, message: 'success'});
}