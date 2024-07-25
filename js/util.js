function showView(hash, callback) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.style.display = 'none');

    const id = hash.replace('#onboarding/', 'view-');
    const targetView = document.getElementById(id);
    if (targetView) {
        targetView.style.display = 'block';
    }
    callback(hash);
}

const WalletStatus = Object.freeze({
    Init: 'Init',
    NoWallet: 'NoWallet',
    Locked: 'Locked',
    Unlocked: 'Unlocked',
    Expired: 'Expired',
    Error: 'error'
});

const MsgType = Object.freeze({
    PluginClicked: 'PluginClicked',
    WalletOpen: 'WalletOpen',
    WalletClose: 'WalletClose',
    WalletCreated:'WalletCreated',
    SetActiveWallet:'SetActiveWallet',
});
