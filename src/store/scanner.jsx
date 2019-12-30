import { handleErrorCode } from '../errors'
import Quagga from 'quagga'
import { QUAGGA_OPTIONS } from '../plugins/quagga-options.js'

const INITIAL_STATE = {
    scannerSeed: 0,
}

export default store => {
    let barcodeScanned = false
    store.on('@init', () => ({ scanner: INITIAL_STATE }))

    store.on('scanner/start', () => {
        store.dispatch('appGlobal/loadingStart')
        barcodeScanned = false
        Quagga.init(
            {
                ...QUAGGA_OPTIONS,
                inputStream: {
                    ...QUAGGA_OPTIONS.inputStream,
                    target: document.querySelector('.scanner-container'),
                },
            },
            err => {
                if (err) {
                    store.dispatch('appGlobal/loadingEnd')
                    handleErrorCode(506)
                    return
                }
                Quagga.start()
                store.dispatch('appGlobal/loadingEnd')

                initOnDetected()
            }
        )
    })

    store.on('scanner/stop', () => {
        try {
            Quagga.stop()
        } catch (err) {}
    })

    store.on('scanner/detected', ({ scanner }, number) => {
        let scannerSeed = Math.random()
        store.dispatch('session/detectedNumber', number)
        return {
            scanner: {
                ...scanner,
                scannerSeed,
            },
        }
    })

    function initOnDetected() {
        Quagga.onDetected(data => {
            // prevent multi-requests
            if (barcodeScanned) return

            const number = data.codeResult.code
            if (number.length === 8) {
                console.log('Successfuly scanned ticket...')
                barcodeScanned = true
                Quagga.stop()

                store.dispatch('scanner/detected', number)
            } else {
                handleErrorCode(507)
            }
        })
    }
}
