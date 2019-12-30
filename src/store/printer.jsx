import { API } from '../config'
import { handleApiError, handleErrorCode } from '../errors'

const INITIAL_STATE = {
    ballotIsPrinted: false,
    error: null,
    isTest: false,
    number: null,
    listOfPrinters: [],
    showPrinterPicker: false,
    showPrintingWindow: false,
    printerIdx: null,
}

export default store => {
    store.on('@init', () => ({ printer: INITIAL_STATE }))

    store.on('printer/getPrinterList', () => {
        console.log('fetching printers')
        API.printer
            .get('/get_printers')
            .then(res => {
                if (res.data.error) throw res.data.error
                store.dispatch('printer/askPrinterSelect', res.data)
            })
            .catch(err => {
                handleErrorCode(523)
            })
    })

    store.on('printer/askPrinterSelect', ({ printer }, printers) => {
        return {
            printer: {
                ...printer,
                listOfPrinters: printers,
                showPrinterPicker: true,
            },
        }
    })

    store.on('printer/pickPrinter', ({ printer }, choice) => {
        return {
            printer: {
                ...printer,
                printerIdx: choice,
                showPrinterPicker: false,
            },
        }
    })

    store.on('printer/print', ({ printer }, { number, test_ballot }) => {
        store.dispatch('printer/printStart', { number, isTest: !!test_ballot })

        API.printer
            .post('/print_ballot', {
                number,
                printer_idx: printer.printerIdx,
                test_ballot,
            })
            .then(res => {
                store.dispatch('printer/printEnd')
            })
            .catch(err => {
                store.dispatch('printer/printFail', err.message)
                handleApiError(err)
            })
    })

    store.on('printer/printStart', ({ printer }, { number, isTest }) => {
        return {
            printer: {
                ...printer,
                showPrintingWindow: true,
                number,
                isTest,
            },
        }
    })

    store.on('printer/printEnd', ({ printer }) => {
        return {
            printer: {
                ...printer,
                ballotIsPrinted: true,
            },
        }
    })

    store.on('printer/printFinished', ({ printer }) => {
        return {
            printer: {
                ...INITIAL_STATE,
                printerIdx: printer.printerIdx,
                listOfPrinters: printer.listOfPrinters,
            },
        }
    })

    store.on('printer/printFail', ({ printer }, error) => {
        return {
            printer: {
                ...printer,
                error,
            },
        }
    })

    store.on('printer/printFailAccept', ({ printer }, error) => {
        return {
            printer: {
                ...printer,
                error: null,
                showPrintingWindow: false,
            },
        }
    })

    store.on('session/end', ({ printer }) => {
        console.log(printer)
        return {
            printer: {
                ...INITIAL_STATE,
                printerIdx: printer.printerIdx,
                listOfPrinters: printer.listOfPrinters,
            },
        }
    })
}
