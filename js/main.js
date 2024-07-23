let __walletMap = new Map();

document.addEventListener("DOMContentLoaded", initDessagePlugin);

async function initDessagePlugin() {

    await initDatabase();
    await loadLastSystemSetting();
    initLoginDiv();
    initDashBoard();
    // await testRemoveAllWallet();
    pluginClicked();
    // testKey();
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

function pluginClicked() {
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

function initLoginDiv() {
    document.querySelector(".login-container .primary-button").addEventListener('click', openAllWallets);
}

function initDashBoard() {
    const selectElement = document.getElementById("wallet-dropdown");
    selectElement.addEventListener('change', function (event) {
        const selectedValue = event.target.value;
        console.log('------>>>selected value:', selectedValue);
        fillWalletContent(selectedValue);
    });
}

function openAllWallets() {
    const password = document.querySelector(".login-container input").value;
    chrome.runtime.sendMessage({action: MsgType.WalletOpen, password: password}, response => {
        if (response.status) {
            const obj = JSON.parse(response.message);
            __walletMap = new Map(Object.entries(obj));
            showView('#onboarding/dashboard', router);
            console.log("------------>>>", response.message, obj, __walletMap.size, __walletMap instanceof Map);
            return;
        }
        const errTips = document.querySelector(".login-container .login-error");
        errTips.innerText = response.message;
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

async function testRemoveAllWallet() {
    await initDatabase();
    await databaseDeleteByFilter(__tableNameWallet, (val) => {
        console.log("delete all");
        return true;

    })
}

function populateDashboard() {
    fillWalletList();
}

function fillWalletList() {
    const selectElement = document.getElementById("wallet-dropdown");
    selectElement.innerHTML = '';
    const option = document.getElementById("wallet-option-item");

    __walletMap.forEach((wallet, addr) => {
        const optionDiv = option.cloneNode(true);
        optionDiv.style.display = 'block';
        optionDiv.value = wallet.address;
        optionDiv.textContent = wallet.address;
        selectElement.appendChild(optionDiv);
    });

    let selAddr = __systemSetting.address;
    if (selAddr) {
        selectElement.value = selAddr;
    } else {
        selectElement.selectedIndex = 0;
        __systemSetting.address = selectElement.value;
        __systemSetting.syncToDB().then(r => {
        })
        selAddr = selectElement.value;
    }
    fillWalletContent(selAddr);
}

function fillWalletContent(addr) {
    const wallet = __walletMap.get(addr);
    console.log("------>>>wallet data:=>", wallet.toString());

    const addrList = document.getElementById("address-list-id");
    addrList.innerHTML = '';
    const addrItemTmp = document.getElementById("address-item-template");
    let addrItem = addrItemTmp.cloneNode(true);
    addrItem.id = '';
    addrItem.style.display = 'block';
    addrItem.querySelector('.address-label').textContent = "ETH Address:"
    addrItem.querySelector('.address-val').textContent = wallet.ethAddr;
    addrList.appendChild(addrItem);

    addrItem = addrItemTmp.cloneNode(true);
    addrItem.id = '';
    addrItem.style.display = 'block';
    addrItem.querySelector('.address-label').textContent = "BTC Address:"
    addrItem.querySelector('.address-val').textContent = wallet.btcAddr;
    addrList.appendChild(addrItem);

    addrItem = addrItemTmp.cloneNode(true);
    addrItem.id = '';
    addrItem.style.display = 'block';
    addrItem.querySelector('.address-label').textContent = "BTC Test Address:"
    addrItem.querySelector('.address-val').textContent = wallet.testBtcAddr;
    addrList.appendChild(addrItem);

    addrItem = addrItemTmp.cloneNode(true);
    addrItem.id = '';
    addrItem.style.display = 'block';
    addrItem.querySelector('.address-label').textContent = "Nostr Address:"
    addrItem.querySelector('.address-val').textContent = wallet.nostrAddr;
    addrList.appendChild(addrItem);
}