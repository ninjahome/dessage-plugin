async function loadLocalWallet() {
    const wallets = await databaseQueryAll(__tableNameWallet)
    if (!wallets) {
        return null;
    }
    let walletObj = [];
    for (let i = 0; i < wallets.length; i++) {
        const walletStr = wallets[i];
        const wallet = new Wallet(walletStr.uuid, walletStr.address, walletStr.cipherTxt, walletStr.mnemonic)
        console.log("load wallet success:=>", wallet.address);
        walletObj.push(wallet);
    }
    return walletObj;
}

class Wallet {
    constructor(uuid, addr, cipherTxt, mnemonic, key) {
        this.uuid = uuid;
        this.address = addr;
        this.cipherTxt = cipherTxt;
        this.mnemonic = mnemonic;
        this.key = key;
    }

    async syncToDb() {
        const item = {
            uuid: this.uuid,
            address: this.address,
            cipherTxt: this.cipherTxt,
            mnemonic: this.mnemonic,
        }
        const result = await databaseAddItem(__tableNameWallet, item);
        console.log("save wallet result=>", result);
    }

    decryptKey(pwd) {
        const decryptedPri = decryptMnemonic(this.cipherTxt, pwd);
        const priArray = hexStringToByteArray(decryptedPri);
        const key = new ProtocolKey(priArray);
        if (this.address !== key.NinjaAddr) {
            throw new Error("address and private key are not match");
        }
        this.key = key;
    }
}

function hexStringToByteArray(hexString) {
    if (hexString.length % 2 !== 0) {
        throw new Error("Hex string must have an even length");
    }
    const byteArray = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        byteArray[i / 2] = parseInt(hexString.slice(i, i + 2), 16);
    }
    return byteArray;
}

function wordArrayToByteArray(wordArray) {
    const byteArray = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
        byteArray.push((wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff);
    }
    return byteArray;
}


function NewWallet(mnemonic, password) {

    const uuid = generateUUID();

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const pri = seed.slice(0, 32);

    const key = new ProtocolKey(pri);
    const addr = key.NinjaAddr;

    const cipherTxt = encryptMnemonic(pri.toString('hex'), password);
    const em = encryptMnemonic(mnemonic, password);

    console.log('Encrypted pri:', cipherTxt);
    console.log('Encrypted mnemonic:', em);

    return new Wallet(uuid, addr, cipherTxt, em, key);
}

class ProtocolKey {
    constructor(pri) {

        const ninjaKey = castToNinjaKey(pri);
        const ecPriKey = castToEcKey(pri);
        this.NinjaKey = ninjaKey;
        this.ECPri = ecPriKey;

        this.NinjaAddr = getNinjaAddress(ninjaKey);

        this.EthAddr = generateEthAddress(ecPriKey);
        this.BtcAddr = generateBtcAddress(ecPriKey);
        this.BtcTestAddr = generateBtcAddress(ecPriKey, true);
        this.NostrAddr = generateNostrAddress(ecPriKey);
        console.log("new key:[ninja addr:", this.NinjaAddr,
            "] [eth addr:", this.EthAddr, "]",
            "] [btc addr:", this.BtcAddr, "]",
            "] [test btc addr:", this.BtcTestAddr, "]",
            "] [nostr addr:", this.NostrAddr, "]");
    }
}

function generateEthAddress(ecPriKey) {
    const publicKey = ecPriKey.getPublic();
    const publicKeyBytes = publicKey.encode('array', false).slice(1);
    const hashedPublicKey = EthereumJSUtil.keccak256(publicKeyBytes).toString('hex');
    return '0x' + hashedPublicKey.slice(-40);
}


function generateBtcAddress(ecPriKey, isTestNet = false) {
    const pubKey = ecPriKey.getPublic(true, 'hex')
    // console.log('Compressed Public Key:', pubKey);
    const publicKeyBytes = hexStringToByteArray(pubKey)
    const wordArray = CryptoLib.lib.WordArray.create(publicKeyBytes);
    const sha256Hash = CryptoLib.SHA256(wordArray);
    // console.log("hash256------->>", wordArrayToByteArray(sha256Hash));
    const bytes160 = CryptoLib.RIPEMD160(sha256Hash);
    const ripemd160Hash = wordArrayToByteArray(bytes160)
    // console.log("RIPEMD160------->>", ripemd160Hash);

    let version = '00'; // Mainnet version byte for P2PKH addresses
    if (isTestNet) {
        version = '6f';
    }
    const versionByte = new Uint8Array([parseInt(version, 16)]);
    const versionedPayload = new Uint8Array(versionByte.length + ripemd160Hash.length);
    versionedPayload.set(versionByte, 0);
    versionedPayload.set(ripemd160Hash, versionByte.length);

    const wordPayload = CryptoLib.lib.WordArray.create(versionedPayload);
    const checksum = CryptoLib.SHA256(CryptoLib.SHA256(wordPayload));
    const checkSumArray = wordArrayToByteArray(checksum);
    const finalPayload = new Uint8Array(versionedPayload.length + 4);
    finalPayload.set(versionedPayload, 0);
    finalPayload.set(checkSumArray.slice(0, 4), versionedPayload.length);

    const btcAddress = base58.encode(finalPayload);
    // console.log('Bitcoin Address:', btcAddress);
    return btcAddress;
}

function generateNostrAddress(ecPriKey) {
    const ecPubKey = ecPriKey.getPublic(true, 'hex');
    // console.log('Public Key:', ecPubKey);
    const publicBytes = hexStringToByteArray(ecPubKey);
    const subBts = publicBytes.slice(1);
    // console.log("publicBytes=>", publicBytes);
    const bits5 = convertBits(subBts, 8, 5);
    // console.log(bits5);
    const encoded = Bech32Lib.bech32.encode('npub', bits5);
    // console.log(encoded);
    return encoded;
}

function castToEcKey(secretKey) {
    const EC = elliptic;
    const curve = new EC('secp256k1');
    const ecPriKey = curve.keyFromPrivate(secretKey);

    // const privateKeyHex = ecPriKey.getPrivate('hex');
    // console.log('Private Key:', privateKeyHex);

    // The privateKey.D must < N
    if (ecPriKey.getPrivate().gte(curve.n)) {
        throw new Error('Invalid private key, >=N');
    }

    // The privateKey.D must not be zero or negative.
    if (ecPriKey.getPrivate() <= 0n) {
        throw new Error('Invalid private key, zero or negative');
    }

    ecPriKey.getPublic();
    if (!ecPriKey.pub) {
        throw new Error('Invalid private key');
    }
    return ecPriKey;
}

function castToNinjaKey(seed) {
    // console.log("Public Key:", keyPair.publicKey);
    // console.log("Secret Key:", keyPair.secretKey);
    return nacl.box.keyPair.fromSecretKey(seed);
}

const NinjaAddrLen = 32
const NinjaAddrPrefix = "NJ";

function getNinjaAddress(ninjaKey) {
    const publicKey = ninjaKey.publicKey;
    const subAddr = new Uint8Array(NinjaAddrLen);

    subAddr.set(publicKey.subarray(0, NinjaAddrLen));
    const encodedAddress = base58.encode(subAddr);
    return NinjaAddrPrefix + encodedAddress;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function testPeerToPeerCrypto(msg) {
    const aliceKeyPair = nacl.box.keyPair();
    const alicePublicKey = aliceKeyPair.publicKey;
    const alicePrivateKey = aliceKeyPair.secretKey;

    const bobKeyPair = nacl.box.keyPair();
    const bobPublicKey = bobKeyPair.publicKey;
    const bobPrivateKey = bobKeyPair.secretKey;

    const sharedKeyAlice = nacl.box.before(bobPublicKey, alicePrivateKey);
    const sharedKeyBob = nacl.box.before(alicePublicKey, bobPrivateKey);

    console.log(nacl.util.encodeBase64(sharedKeyAlice) === nacl.util.encodeBase64(sharedKeyBob));

    const message = nacl.util.decodeUTF8(msg);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encryptedMessage = nacl.box.after(message, nonce, sharedKeyAlice);

    const decryptedMessage = nacl.box.open.after(encryptedMessage, nonce, sharedKeyBob);
    // console.log(nacl.util.encodeUTF8(decryptedMessage));
}

// 定义 encryptMnemonic 和 decryptMnemonic 函数
function encryptMnemonic(mnemonic, password) {
    const salt = CryptoLib.lib.WordArray.random(128 / 8);
    const key = CryptoLib.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 1000
    });
    const iv = CryptoLib.lib.WordArray.random(128 / 8);
    const encrypted = CryptoLib.AES.encrypt(mnemonic, key, {iv: iv});

    return {
        cipherTxt: encrypted.toString(),
        iv: iv.toString(),
        salt: salt.toString()
    };
}

function decryptMnemonic(encryptedData, password) {
    const salt = CryptoLib.enc.Hex.parse(encryptedData.salt);
    const iv = CryptoLib.enc.Hex.parse(encryptedData.iv);
    const key = CryptoLib.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 1000
    });
    const decrypted = CryptoLib.AES.decrypt(encryptedData.cipherTxt, key, {iv: iv});

    return decrypted.toString(CryptoLib.enc.Utf8);
}

function convertBits(data, fromBits, toBits, pad = true) {
    let acc = 0;
    let bits = 0;
    const result = [];
    const maxv = (1 << toBits) - 1;

    for (let value of data) {
        if (value < 0 || value >> fromBits !== 0) {
            throw new Error('Invalid value for convertBits');
        }
        acc = (acc << fromBits) | value;
        bits += fromBits;
        while (bits >= toBits) {
            bits -= toBits;
            result.push((acc >> bits) & maxv);
        }
    }
    if (pad) {
        if (bits > 0) {
            result.push((acc << (toBits - bits)) & maxv);
        }
    } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
        throw new Error('Invalid data for convertBits');
    }

    return result;
}