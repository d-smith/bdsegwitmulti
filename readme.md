# Blockdaemon Multisig Example

Example of Multi-sig native segwit 2 of 4 signed using two MPC keys managed
by Blockdaemon builder vault.

## Generate two BD keys using [keygen.js](https://github.com/d-smith/bdsegwit/blob/main/genkey.js)

```
$ node genkey.js 
Generated key with key ID: b1bhJd9yvrdteJSptKdjsq6RWz2k
03262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb
segwit address is bcrt1qes9kmkel25zph4yqpt3cd78vyfxd9rf0j9u3f2
pkh is cc0b6ddb3f55041bd4800ae386f8ec224cd28d2f

$ node genkey.js 
Generated key with key ID: VwPrid0v2cQjQZtfZPJrgW9ni1r5
0256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b393
segwit address is bcrt1q3vxlctd94r2hfa6dtv0et5h7rcnr90zat48l75
pkh is 8b0dfc2da5a8d574f74d5b1f95d2fe1e2632bc5d
```

## Generate and import wallets

```
npx bitcointestwalletsgenerator --entropy 16
./import_privkeys.sh: line 25: bitcoin-cli: command not found
./import_privkeys.sh: ERROR at 10:52:31.368977

alias bcli='docker exec -it bitcoin bitcoin-cli -datadir=config'

count=0
wallets=(alice_1 alice_2 alice_3 bob_1 bob_2 bob_3 carol_1 carol_2 carol_3 dave_1 dave_2 dave_3 eve_1 eve_2 eve_3 mallory_1 mallory_2 mallory_3)

cat wallets.json | jq -r '.[][] | (.wif // empty)' |
while read -r wif
do
    bcli importprivkey ${wif} ${wallets[count]}
    ((count ++))
done
```
## Generate some blocks

bcli generatetoaddress 101 bcrt1qr7x0sr05gduh94s70nep6v4jflfehfpg6xk3ea

## Create P2WSH Multisig UTXO

```
$ node genmsutxo.js 
Witness script:
522103262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb210256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b3932103d9a61a19c36661a50a9da518df397173c284d22e9e69348cfded0fcf7eb74be421021b3afa8c5659391d79311f11ac4b276605932d71f93713e260b72a289b9d398854ae

Witness script SHA256:
f8f8051105b5fcb6d9bb0290dc83393cf122c4d537cbb45c35b9861f2749ba27

P2WSH address
bcrt1qlruq2yg9kh7tdkdmq2gdeqee8ncj93x4xl9mghp4hxrp7f6fhgnsfx49g7
```

We can decode the script.

```
$ bcli decodescript 522103262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb210256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b3932103d9a61a19c36661a50a9da518df397173c284d22e9e69348cfded0fcf7eb74be421021b3afa8c5659391d79311f11ac4b276605932d71f93713e260b72a289b9d398854ae
{
  "asm": "2 03262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb 0256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b393 03d9a61a19c36661a50a9da518df397173c284d22e9e69348cfded0fcf7eb74be4 021b3afa8c5659391d79311f11ac4b276605932d71f93713e260b72a289b9d3988 4 OP_CHECKMULTISIG",
  "desc": "multi(2,03262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb,0256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b393,03d9a61a19c36661a50a9da518df397173c284d22e9e69348cfded0fcf7eb74be4,021b3afa8c5659391d79311f11ac4b276605932d71f93713e260b72a289b9d3988)#u9s67nn4",
  "type": "multisig",
  "p2sh": "2NB44HwwETgMk9CCEAXzhcmBFTTvwC1rv4U",
  "segwit": {
    "asm": "0 f8f8051105b5fcb6d9bb0290dc83393cf122c4d537cbb45c35b9861f2749ba27",
    "desc": "addr(bcrt1qlruq2yg9kh7tdkdmq2gdeqee8ncj93x4xl9mghp4hxrp7f6fhgnsfx49g7)#f0fug0tt",
    "hex": "0020f8f8051105b5fcb6d9bb0290dc83393cf122c4d537cbb45c35b9861f2749ba27",
    "address": "bcrt1qlruq2yg9kh7tdkdmq2gdeqee8ncj93x4xl9mghp4hxrp7f6fhgnsfx49g7",
    "type": "witness_v0_scripthash",
    "p2sh-segwit": "2MzoTPqsrzMsgZ6AssP48AKLNpNCfAqmP2p"
  }
}
```

## Fund the P2WSH address

```
$ bcli sendtoaddress bcrt1qlruq2yg9kh7tdkdmq2gdeqee8ncj93x4xl9mghp4hxrp7f6fhgnsfx49g7 1

6bf55cfa8ca6bec12f0b0e55546cb80929a2430e163efceb4aa4cb7aa8a439f8
```

Get vout from the spending transaction

```
bcli gettransaction 6bf55cfa8ca6bec12f0b0e55546cb80929a2430e163efceb4aa4cb7aa8a439f8
```

### Prepare the spending transaction

```

node spend.js 
do presigning
returning signer for keyId: b1bhJd9yvrdteJSptKdjsq6RWz2k
do presigning
returning signer for keyId: VwPrid0v2cQjQZtfZPJrgW9ni1r5
signing with bd1
presigIDs: [
  'juotU4s9MeKkU3AhcmHBRW000000',
  'juotU4s9MeKkU3AhcmHBRW000001',
  'juotU4s9MeKkU3AhcmHBRW000002',
  'juotU4s9MeKkU3AhcmHBRW000003',
  'juotU4s9MeKkU3AhcmHBRW000004'
]
Signature: 304402207212bc4906979ee78a406c9a1bee4ab945844fdeb5393221d0f1f92ead1fe46a02207215ca4d6587ae2d9c166008e4a7ebfa3c40ea261670f873eb7d4351add1f941
signing with bd2
presigIDs: [
  '4zh22qOkLYyaXY3DzYp4Bv000000',
  '4zh22qOkLYyaXY3DzYp4Bv000001',
  '4zh22qOkLYyaXY3DzYp4Bv000002',
  '4zh22qOkLYyaXY3DzYp4Bv000003',
  '4zh22qOkLYyaXY3DzYp4Bv000004'
]
Signature: 3045022100e8aa8703c9a85426fc6e544f62bf5a092d963e2eadb9c2d98ac8bd85523209ae022032364c93968a1df50bf7165398212ec386debbfcb0ab72eaf2ba2ab1776afa8e
Transaction hexadecimal:
02000000000101f839a4a87acba44aebfc3e160e43a22909b86c54550e0b2fc1bea68cfa5cf56b0100000000ffffffff01605af40500000000160014b94769b61a8690d376a9bcbe57e16f955c43f3ba040047304402207212bc4906979ee78a406c9a1bee4ab945844fdeb5393221d0f1f92ead1fe46a02207215ca4d6587ae2d9c166008e4a7ebfa3c40ea261670f873eb7d4351add1f94101483045022100e8aa8703c9a85426fc6e544f62bf5a092d963e2eadb9c2d98ac8bd85523209ae022032364c93968a1df50bf7165398212ec386debbfcb0ab72eaf2ba2ab1776afa8e018b522103262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb210256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b3932103d9a61a19c36661a50a9da518df397173c284d22e9e69348cfded0fcf7eb74be421021b3afa8c5659391d79311f11ac4b276605932d71f93713e260b72a289b9d398854ae00000000
```

## Decode the transaction

```
bcli decoderawtransaction 02000000000101f839a4a87acba44aebfc3e160e43a22909b86c54550e0b2fc1bea68cfa5cf56b0100000000ffffffff01605af40500000000160014b94769b61a8690d376a9bcbe57e16f955c43f3ba040047304402207212bc4906979ee78a406c9a1bee4ab945844fdeb5393221d0f1f92ead1fe46a02207215ca4d6587ae2d9c166008e4a7ebfa3c40ea261670f873eb7d4351add1f94101483045022100e8aa8703c9a85426fc6e544f62bf5a092d963e2eadb9c2d98ac8bd85523209ae022032364c93968a1df50bf7165398212ec386debbfcb0ab72eaf2ba2ab1776afa8e018b522103262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb210256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b3932103d9a61a19c36661a50a9da518df397173c284d22e9e69348cfded0fcf7eb74be421021b3afa8c5659391d79311f11ac4b276605932d71f93713e260b72a289b9d398854ae00000000

{
  "txid": "e2ae49f1eba5271b8fcf4e21e5ac25ff1087d0935f76ccc5bcdf8d19bc54a168",
  "hash": "3f56769e0b7b0c7f9d108cf10c6764e74a9b16caaf540b618444fc6d1948a6e1",
  "version": 2,
  "size": 371,
  "vsize": 155,
  "weight": 617,
  "locktime": 0,
  "vin": [
    {
      "txid": "6bf55cfa8ca6bec12f0b0e55546cb80929a2430e163efceb4aa4cb7aa8a439f8",
      "vout": 1,
      "scriptSig": {
        "asm": "",
        "hex": ""
      },
      "txinwitness": [
        "",
        "304402207212bc4906979ee78a406c9a1bee4ab945844fdeb5393221d0f1f92ead1fe46a02207215ca4d6587ae2d9c166008e4a7ebfa3c40ea261670f873eb7d4351add1f94101",
        "3045022100e8aa8703c9a85426fc6e544f62bf5a092d963e2eadb9c2d98ac8bd85523209ae022032364c93968a1df50bf7165398212ec386debbfcb0ab72eaf2ba2ab1776afa8e01",
        "522103262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb210256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b3932103d9a61a19c36661a50a9da518df397173c284d22e9e69348cfded0fcf7eb74be421021b3afa8c5659391d79311f11ac4b276605932d71f93713e260b72a289b9d398854ae"
      ],
      "sequence": 4294967295
    }
  ],
  "vout": [
    {
      "value": 0.99900000,
      "n": 0,
      "scriptPubKey": {
        "asm": "0 b94769b61a8690d376a9bcbe57e16f955c43f3ba",
        "desc": "addr(bcrt1qh9rknds6s6gdxa4fhjl90ct0j4wy8ua6xrzh0t)#9rsw60xu",
        "hex": "0014b94769b61a8690d376a9bcbe57e16f955c43f3ba",
        "address": "bcrt1qh9rknds6s6gdxa4fhjl90ct0j4wy8ua6xrzh0t",
        "type": "witness_v0_keyhash"
      }
    }
  ]
}
```

## Send transaction

```
bcli sendrawtransaction 02000000000101f839a4a87acba44aebfc3e160e43a22909b86c54550e0b2fc1bea68cfa5cf56b0100000000ffffffff01605af40500000000160014b94769b61a8690d376a9bcbe57e16f955c43f3ba040047304402207212bc4906979ee78a406c9a1bee4ab945844fdeb5393221d0f1f92ead1fe46a02207215ca4d6587ae2d9c166008e4a7ebfa3c40ea261670f873eb7d4351add1f94101483045022100e8aa8703c9a85426fc6e544f62bf5a092d963e2eadb9c2d98ac8bd85523209ae022032364c93968a1df50bf7165398212ec386debbfcb0ab72eaf2ba2ab1776afa8e018b522103262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb210256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b3932103d9a61a19c36661a50a9da518df397173c284d22e9e69348cfded0fcf7eb74be421021b3afa8c5659391d79311f11ac4b276605932d71f93713e260b72a289b9d398854ae00000000

e2ae49f1eba5271b8fcf4e21e5ac25ff1087d0935f76ccc5bcdf8d19bc54a168
```


## Variants

Playing around with send, if we sign with a key outside of the signature
set an error is generated. If we do not supply enough signatures from the
quorum an error is generated when we attempt to finalize the psbt.


