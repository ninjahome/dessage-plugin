
function initDashBoard() {
    const selectElement = document.getElementById("wallet-dropdown");
    selectElement.addEventListener('change', function (event) {
        const selectedValue = event.target.value;
        console.log('------>>>selected value:', selectedValue);
        setupWalletArea(selectedValue);
    });
}

function setupWalletArea(addr) {
    __systemSetting.changeAddr(addr).then();
    notifyBackgroundActiveWallet(__systemSetting.address);
    const wallet = __walletMap.get(addr);
    setupNinjaDetail(wallet);
    setupEtherArea(wallet);
    setupBtcArea(wallet);
    setupNostr(wallet);
}

function populateDashboard() {
    setAccountSwitchArea();
    setupWalletArea(__systemSetting.address);
}

function setAccountSwitchArea() {
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
        });
    }
}

function notifyBackgroundActiveWallet(address) {
    browser.runtime.sendMessage({action: MsgType.SetActiveWallet, address: address}).then(response => {
        if (response.status) {
            console.log("set active wallet success");
            return;
        }
        // TODO::show errors to user
        const errTips = document.querySelector(".login-container .login-error");
        errTips.innerText = response.message;
    }).catch(error => {
        console.error('Error sending message:', error);
    });
}

function setupNinjaDetail(wallet) {
    // 实现细节
}

function setupEtherArea(wallet) {
    const ethArea = document.getElementById("eth-account-area");
    ethArea.querySelector(".eth-address-val").textContent = wallet.ethAddr;
}

function setupBtcArea(wallet) {
    const btcArea = document.getElementById("btc-account-area");
    btcArea.querySelector(".btc-address-val").textContent = wallet.btcAddr;
}

function setupNostr(wallet) {
    const nostrArea = document.getElementById("nostr-account-area");
    nostrArea.querySelector(".nostr-address-val").textContent = wallet.nostrAddr;
}
