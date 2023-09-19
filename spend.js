const bitcoin = require('bitcoinjs-lib')
const { alice, bob, carol, dave } = require('./wallets.json')
const network = bitcoin.networks.regtest
const { TSMClient, algorithms, curves } = require('@sepior/tsm');



const bd1 = '03262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb'
const bd2 = '0256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b393'
const bd1KeyID = 'b1bhJd9yvrdteJSptKdjsq6RWz2k';
const bd2KeyID = 'VwPrid0v2cQjQZtfZPJrgW9ni1r5';
const TX_ID = '551495c00eb684ac573838f24a9cf8f09e18dbf865738b5ffaa33748dabd000b'
const TX_VOUT = 1
const witnessScriptHash = 'f8f8051105b5fcb6d9bb0290dc83393cf122c4d537cbb45c35b9861f2749ba27'

async function getClients() {
    let playerCount = 3;
    let threshold = 1;

    let creds = require('./creds.json');
    let tsmClient1 = await TSMClient.init(playerCount, threshold, [
        {
            url: creds.urls[0],
            userID: creds.userID,
            password: creds.passwords[0]
        }]);

    let tsmClient2 = await TSMClient.init(playerCount, threshold, [
        {
            url: creds.urls[1],
            userID: creds.userID,
            password: creds.passwords[1]
        }]);

    let tsmClient3 = await TSMClient.init(playerCount, threshold, [
        {
            url: creds.urls[2],
            userID: creds.userID,
            password: creds.passwords[2]
        }]);

    return { tsmClient1, tsmClient2, tsmClient3 };
}

async function makeSigner(sessionID, keyId, chainPath, clients) {
    let { tsmClient1, tsmClient2, tsmClient3 } = clients;

    let [pk, pkDER] = await tsmClient1.publicKey(algorithms.ECDSA, keyId, chainPath);
    const pkCompressed = await pk2Sec1Compressed(tsmClient1, pkDER);

    console.log("do presigning");

    presigCount = 5;
    results = await Promise.all([
        tsmClient1.presigGenWithSessionID(algorithms.ECDSA, sessionID, keyId, presigCount),
        tsmClient2.presigGenWithSessionID(algorithms.ECDSA, sessionID, keyId, presigCount),
        tsmClient3.presigGenWithSessionID(algorithms.ECDSA, sessionID, keyId, presigCount)
    ]);

    let presigIDs = results[0];


    const signer = {
        network: network,
        publicKey: pkCompressed,
        sign: async (hash) => {
            console.log("presigIDs:", presigIDs);
            const [partialSig1, ,] = await tsmClient1.partialSignWithPresig(algorithms.ECDSA, keyId, presigIDs[0], chainPath, hash);
            const [partialSig2, ,] = await tsmClient2.partialSignWithPresig(algorithms.ECDSA, keyId, presigIDs[0], chainPath, hash);
            const [partialSig3, ,] = await tsmClient3.partialSignWithPresig(algorithms.ECDSA, keyId, presigIDs[0], chainPath, hash);

            let [signature,] = await tsmClient1.finalize(algorithms.ECDSA, [partialSig1, partialSig2, partialSig3]);
            console.log("Signature:", Buffer.from(signature).toString('hex'));

            var asn = require('asn1.js');
            var ECSignature = asn.define('ECSignature', function () {
                this.seq().obj(
                    this.key('R').int(),
                    this.key('S').int()
                );
            });

            var sig = ECSignature.decode(Buffer.from(signature), 'der');
            srSignature = sig.R.toString('hex').padStart(64, '0') + sig.S.toString('hex').padStart(64, '0');
            return Buffer.from(srSignature, 'hex');
        }
    }
    console.log("returning signer for keyId:", keyId);
    return signer;
}

async function demo() {

    const p2ms = bitcoin.payments.p2ms({
        m: 2, pubkeys: [
            Buffer.from(bd1, 'hex'), // BD1
            Buffer.from(bd2, 'hex'), //BD2
            Buffer.from(carol[1].pubKey, 'hex'),
            Buffer.from(dave[1].pubKey, 'hex'),
        ], network
    })

    const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network })

    const psbt = new bitcoin.Psbt({ network })
        .addInput({
            hash: TX_ID,
            index: TX_VOUT,
            witnessScript: p2wsh.redeem.output,
            witnessUtxo: {
                script: Buffer.from('0020' + witnessScriptHash, 'hex'),
                value: 1e8,
            }
        })
        .addOutput({
            address: carol[2].p2wpkh,
            value: 999e5,
        })

    let clients = await getClients();
    let chainPath = new Uint32Array([49, 1, 0, 0, 0]);
    let sessionID = "signing" + Date.now().toString();
    let bd1Signer = await makeSigner(sessionID, bd1KeyID, chainPath, clients);
    let bd2Signer = await makeSigner(sessionID, bd2KeyID, chainPath, clients);

    console.log("signing with bd1");
    await psbt.signInputAsync(0, bd1Signer)
    console.log("signing with bd2");
    await psbt.signInputAsync(0, bd2Signer)


    /* Error if we attempt to sign with a key not in the script -
    Error: Can not sign for this input with the key 02869975f97c1e931f27b728f63d2095818325ef61df0535e9a82bec49d9ff06c5
    const ECPairFactory = require('ecpair');
    const ecc = require('tiny-secp256k1');
    const ECPair = ECPairFactory.ECPairFactory(ecc);
    const keyPairAlice1 = ECPair.fromWIF(alice[1].wif, network)
    psbt.signInput(0, keyPairAlice1)
    */



    psbt.finalizeAllInputs() // Error thrown if insufficient signatures 
    //supplied: Error: Can not finalize input #0

    console.log('Transaction hexadecimal:')
    console.log(psbt.extractTransaction().toHex())
}

async function pk2Sec1Compressed(tsmClient, pk) {
    let [curveName, X, Y] = await tsmClient.parsePublicKey(algorithms.ECDSA, pk);
    let xBytes = Buffer.from(X);
    let prefix = (Y[31] & 0x01) === 0x00 ? Buffer.from([0x02]) : Buffer.from([0x03]);
    return Buffer.concat([prefix, xBytes]);
}

demo();
