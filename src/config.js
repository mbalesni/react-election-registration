const PRODUCTION = process.env.NODE_ENV === 'production'

const CONFIG = {
    BACKEND_BASE_URL: PRODUCTION ? '/api' : 'http://localhost/api',
    COMPLETE_TIMEOUT: PRODUCTION ? process.env.REACT_APP_COMPLETE_TIMEOUT : 5,
    PULSE_INTERVAL: PRODUCTION ? process.env.REACT_APP_PULSE_INTERVAL : 30,
    SENTRY_DSN: PRODUCTION ? process.env.REACT_APP_SENTRY_DSN : null,
    DEBUG: PRODUCTION ? false : true,
}

for (let item in CONFIG) {
    if (CONFIG.hasOwnProperty(item) && CONFIG[item] === undefined) { // when property was NOT set
        throw new Error(`Please specify REACT_APP_${item} in the .env file.`)
    }
}

export default CONFIG
