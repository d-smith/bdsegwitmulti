const bitcoin = require('bitcoinjs-lib')
const { alice, bob, carol, dave } = require('./wallets.json')
const network = bitcoin.networks.regtest

const bd1 = '03262802797e4a68f1b213d2d781e0ec24a404aea09837931aea0a95a1e0b524fb'
const bd2 = '0256dd26ef322b12a5fa823d97455d2fa99b1b18940afe18ddfcdb05762674b393'

const p2ms = bitcoin.payments.p2ms({
    m: 2, pubkeys: [
        Buffer.from(bd1, 'hex'), // BD1
        Buffer.from(bd2, 'hex'), //BD2
        Buffer.from(carol[1].pubKey, 'hex'),
        Buffer.from(dave[1].pubKey, 'hex'),
    ], network
})

console.log('Witness script:')
console.log(p2ms.output.toString('hex'))
console.log()

console.log('Witness script SHA256:')
console.log(bitcoin.crypto.sha256(p2ms.output).toString('hex'))
console.log()

const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network })
console.log('P2WSH address')
console.log(p2wsh.address)