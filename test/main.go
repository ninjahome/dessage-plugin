package main

import (
	"encoding/hex"
	"fmt"
	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/btcutil/bech32"
	"github.com/btcsuite/btcd/btcutil/hdkeychain"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/nbd-wtf/go-nostr"
	"github.com/nbd-wtf/go-nostr/nip19"
	"github.com/tyler-smith/go-bip39"
	"log"
)

func main() {
	test5()
}

func test5() {
	//var priKey, _ = crypto.HexToECDSA("9056dbc21a82398db5e16a5efb546c8335203dccda7ca42b6d53ba727f57db60")
	pkBytes, _ := hex.DecodeString("9056dbc21a82398db5e16a5efb546c8335203dccda7ca42b6d53ba727f57db60")

	btcPrivateKey, btcPublicKey := btcec.PrivKeyFromBytes(pkBytes)
	btcAddress, _ := btcutil.NewAddressPubKey(btcPublicKey.SerializeCompressed(), &chaincfg.MainNetParams)

	ethPri := crypto.ToECDSAUnsafe(pkBytes)
	ethAddress := crypto.PubkeyToAddress(ethPri.PublicKey)

	fmt.Println("Bitcoin Private Key:",
		hex.EncodeToString(btcPrivateKey.Serialize()),
		btcPrivateKey.Serialize(),
		"public addr:", btcAddress.EncodeAddress(),
		"eth addr:", ethAddress.Hex(),
		"eth pri:", hex.EncodeToString(crypto.FromECDSA(ethPri)))
}

func test4() {
	b, err := hex.DecodeString("9056dbc21a82398db5e16a5efb546c8335203dccda7ca42b6d53ba727f57db60")
	if err != nil {
		panic(err)
	}

	_, pk := btcec.PrivKeyFromBytes(b)
	pBytes := pk.SerializeCompressed()
	fmt.Println(pBytes)
	subBts := pBytes[1:]
	publicKeyHex := hex.EncodeToString(subBts)
	fmt.Println(publicKeyHex)

	bits5, err := bech32.ConvertBits(subBts, 8, 5, true)
	if err != nil {
		panic(err)
	}

	fmt.Println(bits5)

	npub, err := bech32.Encode("npub", bits5)
	if err != nil {
		panic(err)
	}
	fmt.Println(npub)
}

func test3() {
	//var key, _ = crypto.HexToECDSA("9056dbc21a82398db5e16a5efb546c8335203dccda7ca42b6d53ba727f57db60")

	//sk := nostr.GeneratePrivateKey()
	sk := "9056dbc21a82398db5e16a5efb546c8335203dccda7ca42b6d53ba727f57db60"
	pk, _ := nostr.GetPublicKey(sk)
	nsec, _ := nip19.EncodePrivateKey(sk)
	npub, _ := nip19.EncodePublicKey(pk)

	fmt.Println("sk:", sk)
	fmt.Println("pk:", pk)
	fmt.Println(nsec)
	fmt.Println(npub)
}

func test2() {
	var key, _ = crypto.HexToECDSA("9056dbc21a82398db5e16a5efb546c8335203dccda7ca42b6d53ba727f57db60")
	pubBytes := crypto.FromECDSAPub(&key.PublicKey)
	fmt.Println(len(pubBytes), hexutil.Encode(pubBytes))

	var keyAddr = crypto.PubkeyToAddress(key.PublicKey)
	fmt.Println(keyAddr)

	pkBytes, err := hex.DecodeString("9056dbc21a82398db5e16a5efb546c8335203dccda7ca42b6d53ba727f57db60")
	_, btcPublicKey := btcec.PrivKeyFromBytes(pkBytes)

	//btcPublicKey := btcec.PublicKey(key.PublicKey)
	btcAddress, err := btcutil.NewAddressPubKey(btcPublicKey.SerializeCompressed(), &chaincfg.MainNetParams)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(btcAddress)

	fmt.Println(btcAddress.EncodeAddress())
	//buf := btcPublicKey.SerializeCompressed()
	//fmt.Println(buf)
	//var hasher = sha256.New()
	//hasher.Write(buf)
	//buf2 := hasher.Sum(nil)
	//fmt.Println(buf2)
	//
	//var hasher2 = ripemd160.New()
	//hasher2.Write(buf2)
	//var hash160 = hasher2.Sum(nil)
	//fmt.Println(hash160)
	//
	//var addr = base58.CheckEncode(hash160[:20], 0x00)
	//fmt.Println(addr)
}

func test1() {
	mnemonic := "mother lyrics salute inform isolate language blade coyote illness topple review advance"
	passphrase := ""
	seed := bip39.NewSeed(mnemonic, passphrase)
	fmt.Println(seed)

	// 使用种子生成主扩展私钥
	masterKey, err := hdkeychain.NewMaster(seed, &chaincfg.MainNetParams)
	if err != nil {
		log.Fatal(err)
	}

	// 获取私钥
	btcPrivateKey, err := masterKey.ECPrivKey()
	if err != nil {
		log.Fatal(err)
	}

	// 获取比特币地址
	btcPublicKey := btcPrivateKey.PubKey()
	btcAddress, err := btcutil.NewAddressPubKey(btcPublicKey.SerializeCompressed(), &chaincfg.MainNetParams)
	if err != nil {
		log.Fatal(err)
	}

	//// 生成以太坊私钥
	//ethPrivateKey, err := crypto.GenerateKey()
	//if err != nil {
	//	log.Fatal(err)
	//}

	// 获取以太坊地址
	//ethAddress := crypto.PubkeyToAddress(btcPrivateKey.PublicKey)

	fmt.Println("Bitcoin Private Key:", btcPrivateKey.Serialize())
	fmt.Println("Bitcoin Address:", btcAddress.EncodeAddress())
	ecdsaPrivateKey := btcPrivateKey.ToECDSA()
	fmt.Println("Ethereum Private Key:", crypto.FromECDSA(ecdsaPrivateKey))
	//fmt.Println("Ethereum Address:", ethAddress.Hex())

	//curve := btcec.S256()
	//privKey, pubKey := btcec.PrivKeyFromBytes(curve, secretKey)
}
