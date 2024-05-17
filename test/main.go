package main

import (
	"fmt"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcutil"
	"github.com/btcsuite/btcutil/hdkeychain"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/tyler-smith/go-bip39"
	"log"
)

func main() {
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
}
