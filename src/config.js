import axios from 'axios'
import { 
    strToBool, 
    setupAuthTokenUpdate, 
    hasUndefinedValues,
} from './utils/functions'

const PROD = process.env.NODE_ENV === 'production'

const DEV_CONFIG = {
    ADMIN_PANEL_URL:    'http://localhost/admin/',
    ASK_CONSENT:        true,
    BACKEND_URL:        'http://localhost/api',
    COMPLETE_TIMEOUT:   30,
    ELECTION_TYPE:      'QR голосування', // could also be 'Е-голосування'
    ELECTION_NAME:     'Демо вибори',
    PRINT_BALLOTS:      true,
    PRINTER_URL:        'http://localhost:8012',
    PULSE_INTERVAL:     30,
    SENTRY_DSN:         null,
}

const PROD_CONFIG = {
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
}

const CONFIG = PROD ? PROD_CONFIG : DEV_CONFIG

if (hasUndefinedValues(CONFIG))
    throw new Error(`Please specify all required variables in the .env file.`)

const backend = axios.create({
    baseURL: CONFIG.BACKEND_URL,
    timeout: 5 * 1000,
})

const printer = axios.create({
    baseURL: CONFIG.PRINTER_URL,
    timeout: 2 * 60 * 1000, // wait to complete priting
})

const API = {
    regback: setupAuthTokenUpdate(backend),
    printer,
}

export { API }
export default CONFIG