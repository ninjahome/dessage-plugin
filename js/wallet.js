function generateNewWallet() {
    let wallet = ethers.Wallet.createRandom();
    console.log('Mnemonic:', wallet.mnemonic.phrase);
    console.log('Private Key:', wallet.privateKey);
}
