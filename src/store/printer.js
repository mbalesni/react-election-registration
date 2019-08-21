import { API } from '../config'
import { handleApiError, handleErrorCode } from '../errors'

const INITIAL_STATE = {
  ballotIsPrinted: false,
  error: null,
  listOfPrinters: [],
  showPrinterPicker: false,
  showPrintingWindow: false,
  printerIdx: null,
}
    
export default store => {
    store.on('@init', () => ({ printer: INITIAL_STATE }));

    store.on('printer/getPrinterList', () => {
      console.log('fetching printers')
      API.printer.get('/get_printers')
        .then(res => {
          if (res.data.error) throw res.data.error
          store.dispatch('printer/askPrinterSelect', res.data)
        })
        .catch(err => {
          handleApiError(err)
        })
    })

    store.on('printer/askPrinterSelect', ({ printer }, printers) => {
      return {
        printer: {
          ...printer,
          listOfPrinters: printers,
          showPrinterPicker: true,
        }
      }
    })

    store.on('printer/pickPrinter', ({ printer }, choice) => {
      return {
        printer: {
          ...printer,
          printerIdx: choice,
          showPrinterPicker: false,
        }
      }
    })

    store.on('printer/print', ({ printer }, number) => {
        store.dispatch('printer/printStart')

        API.printer.post('/print_ballot', { number, printer_idx: printer.printerIdx })
          .then(res => {
            store.dispatch('printer/printEnd')
          })
          .catch(err => {
            store.dispatch('printer/printFail', err.message)
            handleApiError(err)
          })
    })

    store.on('printer/printStart', ({ printer }) => {
      return { 
        printer: { 
          ...printer, 
          showPrintingWindow: true,
        }
      }
    })

    store.on('printer/printEnd', ({ printer }) => {
      return { 
        printer: { 
          ...printer, 
          ballotIsPrinted: true,
        }
      }
    })

    store.on('printer/printFail', ({ printer }, error) => {
      return { 
        printer: { 
          ...printer, 
          error,
        }
      }
    })

    store.on('printer/printFailAccept', ({ printer }, error) => {
      return { 
        printer: { 
          ...printer, 
          error: null,
          showPrintingWindow: false,
        }
      }
    })

    store.on('session/end', ({ printer }) => {
      console.log(printer)
      return {
        printer: {
          ...INITIAL_STATE,
          printerIdx: printer.printerIdx
        }
      }
    })
}