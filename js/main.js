let __walletMap = new Map();

document.addEventListener("DOMContentLoaded", initDessagePlugin);

async function initDessagePlugin() {

    await initDatabase();
    await loadLastSystemSetting();

    checkBackgroundStatus();
    initLoginDiv();
    initDashBoard();

    // testKey();
    // await testRemoveAllWallet();
}

function checkBackgroundStatus() {
    const request = {action: MsgType.PluginClicked};
    chrome.runtime.sendMessage(request, response => {
        console.log("request=>", JSON.stringify(request));
        if (!response) {
            console.error('Error: Response is undefined or null.');
            return;
        }
        console.log("------>>>response=>", JSON.stringify(response));

        switch (response.status) {
            case WalletStatus.NoWallet:
                chrome.tabs.create({
                    url: chrome.runtime.getURL("html/home.html#onboarding/welcome")
                });
                return;
            case WalletStatus.Locked:
            case WalletStatus.Expired:
                showView('#onboarding/unlock-plugin', router);
                return;
            case WalletStatus.Unlocked:
                const obj = JSON.parse(response.message);
                __walletMap = new Map(Object.entries(obj));
                console.log("------------>>>", __walletMap.size, __walletMap instanceof Map);
                showView('#onboarding/dashboard', router);
                return;
            case WalletStatus.Error:
                alert("error:" + response.message);
                return;
        }
    });
}

function router(path) {
    if (path === '#onboarding/dashboard') {
        populateDashboard();
    }
    if (path === '#onboarding/confirm-recovery') {
    }
    if (path === '#onboarding/import-wallet') {
    }
    if (path === '#onboarding/account-home') {
    }
}


/***********************************
 *
 *            test area
 *
 * ********************************/

async function testRemoveAllWallet() {
    await initDatabase();
    await databaseDeleteByFilter(__tableNameWallet, (val) => {
        console.log("delete all");
        return true;

    })
}

const {Buffer, Transaction} = EthereumTx;

function testKey() {
    const priArray = hexStringToByteArray("9056dbc21a82398db5e16a5efb546c8335203dccda7ca42b6d53ba727f57db60");
    const key = new ProtocolKey(priArray);

    const privateKeyHex = key.ECKey.getPrivate('hex');
    console.log(priArray, 'Private Key(ethereum or btc):',
        privateKeyHex, "btc address:", key.BtcAddr, "eth address", key.EthAddr);

    const privateArr = hexStringToByteArray(privateKeyHex)
    const publicKey = key.ECKey.getPublic();
    const publicKeyBytes = publicKey.encode('array', false);
    console.log("privateArr=>", privateArr, "\npublicKeyBytes", publicKeyBytes);

    const txParams = {
        nonce: '0x0', // 交易计数器
        gasPrice: '0x09184e72a000', // 每单位 gas 的价格
        gasLimit: '0x2710', // 最大 gas 数量
        to: '0x0000000000000000000000000000000000000000', // 接收方地址
        value: '0x00', // 发送的以太币数量
        data: '0x', // 交易数据
    };

    const tx = new Transaction(txParams, {chain: 'mainnet'});
    const buffer = Buffer.from(privateKeyHex, 'hex');
    tx.sign(buffer);
    console.log(tx.serialize());
}
