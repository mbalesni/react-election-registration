import { API } from '../config'
import { handleApiError, handleErrorCode } from '../errors'

const INITIAL_STATE = {
  ballotIsPrinted: false,
  error: null,
  showPrintingWindow: false,
}
    
export default store => {
    store.on('@init', () => ({ printer: INITIAL_STATE }));

    store.on('printer/print', ({ printer }, number) => {
        store.dispatch('printer/printStart')

        API.printer.post('/print_ballot', { number })
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

    store.on('session/end', () => {
      return {
        printer: INITIAL_STATE
      }
    })
}