function createPrivateKey() {

    const mnemonic = bip39.generateMnemonic();
    console.log(mnemonic);
    const password = "123";

    const seed = bip39.mnemonicToSeedSync(mnemonic, password);
    console.log("Seed:", seed.toString('hex'));

    // 从种子生成私钥（直接取前32字节）
    const secretKey = seed.slice(0, 32);
    console.log("Secret Key:", secretKey.toString('hex'));

    // 使用 elliptic 库从私钥生成公钥
    const EC = elliptic; // 确保 elliptic 正确引用
    const ec = new EC('secp256k1');
    const keyPair = ec.keyFromPrivate(secretKey);
    const privKey = keyPair.getPrivate('hex');
    const pubKey = keyPair.getPublic('hex');

    console.log("Private Key:", privKey);
    console.log("Public Key:", pubKey);
}

function loadLocalWallet() {
    return null;
}