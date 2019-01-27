import randomBytes from 'random-bytes'
import NodeRSA from 'node-rsa'
import { PUBLIC_KEY } from './public-key.js'

export default function rsaEncrypt(order, ballotNumber) {

    // to base64
    order = btoa(order)
    ballotNumber = btoa(ballotNumber)

    // import and set public key
    const key = new NodeRSA()
    let keydata = PUBLIC_KEY
    key.importKey(keydata, 'public')

    // add salt 
    let rndBytes = randomBytes.sync(4)
    let salt = rndBytes.join().split(',').map(byte => {
        return btoa(byte)
    })
    salt = salt.join('')
    order += ":" + salt

    // encrypt order:salt
    let encrypted = key.encrypt(order, 'base64')

    // add ballotNumber
    encrypted = ballotNumber + ":" + encrypted


    console.log("Encrypted token: ", encrypted)

    return encrypted

}