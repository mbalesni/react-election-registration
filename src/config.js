import axios from 'axios'

const PROD = process.env.NODE_ENV === 'production'

const CONFIG = {
    BACKEND_BASE_URL: PROD ? '/api' : 'http://' + (process.env.REACT_APP_LOCAL_IP || 'localhost') + '/api',
    PRINTER_BASE_URL: PROD ? 'http://localhost:8012' : 'http://' + (process.env.REACT_APP_LOCAL_IP || 'localhost') + ':8012',
    COMPLETE_TIMEOUT: PROD ? process.env.REACT_APP_COMPLETE_TIMEOUT : 30,
    PULSE_INTERVAL:   PROD ? process.env.REACT_APP_PULSE_INTERVAL : 30,
    SENTRY_DSN:       PROD ? process.env.REACT_APP_SENTRY_DSN : null,
    ELECTION_TYPE:    'Е-голосування',
    PRINT_BALLOTS:    process.env.REACT_APP_PRINT_BALLOTS === 'true' ? true : false,
    ASK_CONSENT:      process.env.REACT_APP_ASK_CONSENT === 'true' ? true : false,
    OFFICIAL_TITLE:   PROD ? process.env.REACT_APP_ELECTION_NAME : 'Вибори голови студентського парламенту факультету інформаційних технологій',
}

// check that all properties 
// have a value other than undefined
for (let item in CONFIG) {
    if (CONFIG.hasOwnProperty(item) && CONFIG[item] === undefined) {
        throw new Error(`Please specify REACT_APP_${item} in the .env file.`)
    }
}

const back = axios.create({
    baseURL: CONFIG.BACKEND_BASE_URL,
    timeout: 5 * 1000,
})

back.interceptors.response.use(function (response) {
        if (response.data && response.data.auth_token) {
        back.defaults.headers = {
            'X-Auth-Token': response.data.auth_token
        }
        localStorage.setItem('authToken', response.data.auth_token)
    }
    return response
}, function (error) {
    return Promise.reject(error)
})

const printer = axios.create({
    baseURL: CONFIG.PRINTER_BASE_URL,
    timeout: 2 * 60 * 1000, // wait to complete priting
})

const API = {
    back,
    printer,
}

export { API }
export default CONFIG
