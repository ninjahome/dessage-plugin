package main

import (
	"crypto/sha256"
	"fmt"
	"github.com/btcsuite/btcd/btcec"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcutil"
	"github.com/btcsuite/btcutil/hdkeychain"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/tyler-smith/go-bip39"
	"golang.org/x/crypto/ripemd160"
	"log"
)

func main() {
	var key, _ = crypto.HexToECDSA("9056dbc21a82398db5e16a5efb546c8335203dccda7ca42b6d53ba727f57db60")
	pubBytes := crypto.FromECDSAPub(&key.PublicKey)
	fmt.Println(len(pubBytes), hexutil.Encode(pubBytes))

	var keyAddr = crypto.PubkeyToAddress(key.PublicKey)
	fmt.Println(keyAddr)
	btcPublicKey := btcec.PublicKey(key.PublicKey)
	btcAddress, err := btcutil.NewAddressPubKey(btcPublicKey.SerializeCompressed(), &chaincfg.MainNetParams)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(btcAddress)

	fmt.Println(btcAddress.EncodeAddress())
	buf := btcPublicKey.SerializeCompressed()
	fmt.Println(buf)
	var hasher = sha256.New()
	hasher.Write(buf)
	buf2 := hasher.Sum(nil)
	fmt.Println(buf2)

	var hasher2 = ripemd160.New()
	hasher2.Write(buf2)
	var buf3 = hasher2.Sum(nil)
	fmt.Println(buf3)
	//bytes160 := btcutil.Hash160(btcPublicKey.SerializeCompressed())
	//fmt.Println(bytes160)
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

	// 派生出子私钥
	childKey, err := masterKey.Child(hdkeychain.HardenedKeyStart + 0)
	if err != nil {
		log.Fatal(err)
	}

	// 获取私钥
	btcPrivateKey, err := childKey.ECPrivKey()
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
	ethAddress := crypto.PubkeyToAddress(btcPrivateKey.PublicKey)

	fmt.Println("Bitcoin Private Key:", btcPrivateKey.Serialize())
	fmt.Println("Bitcoin Address:", btcAddress.EncodeAddress())
	ecdsaPrivateKey := btcPrivateKey.ToECDSA()
	fmt.Println("Ethereum Private Key:", crypto.FromECDSA(ecdsaPrivateKey))
	fmt.Println("Ethereum Address:", ethAddress.Hex())

	//curve := btcec.S256()
	//privKey, pubKey := btcec.PrivKeyFromBytes(curve, secretKey)
}
