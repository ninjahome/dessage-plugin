function createPrivateKey(mnemonic, password) {

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

function createEthPriKey(secretKey, strict) {
    const EC = elliptic; // 确保 elliptic 正确引用
    const curve = new EC('secp256k1');
    const key = curve.keyFromPrivate(secretKey);

    // const privKey = keyPair.getPrivate('hex');
    // const pubKey = keyPair.getPublic('hex');
    //
    // console.log("Private Key:", privKey);
    // console.log("Public Key:", pubKey);

    if (strict && 8 * d.length !== curve.n.bitLength()) {
        throw new Error(`Invalid length, need ${curve.n.bitLength()} bits`);
    }

    // The privateKey.D must < N
    if (key.getPrivate().gte(curve.n)) {
        throw new Error('Invalid private key, >=N');
    }

    // The privateKey.D must not be zero or negative.
    if (key.getPrivate() <= 0n) {
        throw new Error('Invalid private key, zero or negative');
    }
    key.getPublic();
    if (!key.pub) {
        throw new Error('Invalid private key');
    }
    return key;
}