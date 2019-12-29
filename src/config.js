import axios from 'axios'
import { 
    strToBool, 
    setupAuthTokenUpdate, 
    hasUndefinedValues,
} from './utils/functions'
import { makeMockRegback, makeMockPrinter } from './mock/api'

const PROD = process.env.NODE_ENV === 'production'

let CONFIG = {
    ADMIN_PANEL_URL:    'http://localhost:3000',
    ASK_CONSENT:        true,
    BACKEND_URL:        'http://localhost:8011/api',
    COMPLETE_TIMEOUT:   30,
    ELECTION_TYPE:      'QR голосування', // could also be 'Е-голосування'
    ELECTION_NAME:      'Демо вибори',
    PRINT_BALLOTS:      false,
    PRINTER_URL:        'http://localhost:8012',
    PULSE_INTERVAL:     5,
    SENTRY_DSN:         null,
    USE_SENTRY:         false,
}

if (PROD) {
    CONFIG = {
        ...CONFIG,
        ADMIN_PANEL_URL:    process.env.REACT_APP_BACKEND_URL.concat('/admin/'),
        ASK_CONSENT:        strToBool(process.env.REACT_APP_ASK_CONSENT),
        BACKEND_URL:        process.env.REACT_APP_BACKEND_URL.concat('/api'),
        COMPLETE_TIMEOUT:   process.env.REACT_APP_COMPLETE_TIMEOUT,
        ELECTION_TYPE:      process.env.REACT_APP_ELECTION_TYPE,
        ELECTION_NAME:      process.env.REACT_APP_ELECTION_NAME,
        PRINT_BALLOTS:      strToBool(process.env.REACT_APP_PRINT_BALLOTS),
        PRINTER_URL:        process.env.REACT_APP_PRINTER_URL,
        PULSE_INTERVAL:     process.env.REACT_APP_PULSE_INTERVAL,
        SENTRY_DSN:         process.env.REACT_APP_SENTRY_DSN,
        USE_SENTRY:         strToBool(process.env.REACT_APP_USE_SENTRY),
    }
}

if (hasUndefinedValues(CONFIG))
    throw new Error(`Please specify all required variables in the .env file.`)

const backend = axios.create({
    baseURL: CONFIG.BACKEND_URL,
    timeout: 5 * 1000,
})

const printer = axios.create({
    baseURL: CONFIG.PRINTER_URL,
    timeout: 2 * 60 * 1000, // wait to complete printing
})


/**
 * For demo purposes
 */
const USE_MOCK_API = true

if (USE_MOCK_API) {
    makeMockRegback(backend)
    makeMockPrinter(printer)
}

const API = {
    regback: setupAuthTokenUpdate(backend),
    printer,
}

export { API }
export default CONFIG
