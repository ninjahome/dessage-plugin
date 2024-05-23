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
function byteArrayToHexString(byteArray) {
    return Array.prototype.map.call(byteArray, byte => ('00' + byte.toString(16)).slice(-2)).join('');
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

        // const ecPubKey = ecPriKey.getPublic(true, 'hex');
        // console.log("Eth Public Key:", ecPubKey);

        this.EthAddr = generateEthAddress(ecPriKey);
        this.BtcAddr = generateBtcAddress(ecPriKey);
        this.BtcTestAddr = generateBtcAddress(ecPriKey, true);
        // this.NostrAddr = generateNostrAddress(ecPriKey);
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

// Function to calculate SHA256 hash
function sha256(buffer) {
    const wordArray = CryptoLib.lib.WordArray.create(buffer);
    return CryptoLib.SHA256(wordArray)//.toString(CryptoLib.enc.Hex);
}

// Function to calculate RIPEMD160 hash
function ripemd160(buffer) {
    const wordArray = CryptoLib.lib.WordArray.create(buffer);
    return CryptoLib.RIPEMD160(wordArray).toString(CryptoLib.enc.Hex);
}

function calcHash(buf, hasher) {
    const wordArray = CryptoLib.lib.WordArray.create(buf);
    return hasher(wordArray);
}
function wordArrayToByteArray(wordArray) {
    const byteArray = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
        byteArray.push((wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff);
    }
    return byteArray;
}

// Hash160 函数，计算 RIPEMD-160(SHA-256(buf))
function hash160(buf) {
    console.log(buf);
    // console.log(sha256(buf),hexStringToByteArray(sha256(buf)));
    const sha256Hash = calcHash(buf, CryptoLib.SHA256);
    console.log(wordArrayToByteArray(sha256Hash));
    const ripemd160Hash = calcHash(sha256Hash, CryptoLib.RIPEMD160);
    console.log(wordArrayToByteArray(ripemd160Hash));
    return ripemd160Hash;
}

async function calculateSha256(byteArray) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', byteArray);
    return new Uint8Array(hashBuffer);
}

async function generateBtcAddress(ecPriKey, isTestNet = false) {
    console.log("ec pub key:=>", ecPriKey.getPublic(true, 'hex'));
    // const pubKey = ecPriKey.getPublic(true, 'array');
    const pubKey = ecPriKey.getPublic(true, 'hex')
    console.log('Compressed Public Key:', pubKey);
    const publicKeyBytes = hexStringToByteArray(pubKey)
    // const sha256Hash = await calculateSha256(publicKeyBytes);
    const sha256Hash = await sha256(publicKeyBytes);
    console.log("------->>",sha256Hash);
    console.log("------->>",wordArrayToByteArray(sha256Hash));
    // const bytes160 = hash160(pubKey);
    // console.log(wordArrayToByteArray(bytes160));
    //
    // // Calculate SHA256 hash of the public key
    // const pubKeySha256 = sha256(pubKey);
    //
    // // Calculate RIPEMD160 hash of the SHA256 hash
    // const pubKeyRipemd160 = ripemd160(hexStringToByteArray(pubKeySha256));
    //
    // // Add version byte (0x00 for Main Network)
    // let version = '00';
    // if(isTestNet){
    //     version = '6f';
    // }
    // const versionedPayload = version + pubKeyRipemd160;
    //
    // // Calculate double SHA256 hash for checksum
    // const checksum = sha256(hexStringToByteArray(sha256(hexStringToByteArray(versionedPayload)))).slice(0, 8);
    //
    // // Concatenate versioned payload and checksum
    // const finalPayload = versionedPayload + checksum;
    //
    // // Encode to Base58
    // const btcAddress = base58.encode(hexStringToByteArray(finalPayload));
    // console.log(btcAddress);
    // return btcAddress;
}

function generateNostrAddress(ecPriKey) {
    const publicKey = ecPriKey.getPublic('hex');
    const byteArray = hexStringToByteArray(publicKey);
    console.log(byteArray.length);
    if (byteArray.length > 32) {
        throw new Error('Public key length exceeds 32 bytes');
    }
    const words = Bech32Lib.toWords(byteArray);
    return Bech32Lib.encode('npub', words);
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
    console.log(nacl.util.encodeUTF8(decryptedMessage));
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