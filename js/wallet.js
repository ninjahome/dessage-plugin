function createPrivateKey() {
    const mnemonic = bip39.generateMnemonic();
    console.log(mnemonic);

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    console.log("Seed:", seed.toString('hex'));
}