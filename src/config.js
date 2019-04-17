const PRODUCTION = process.env.NODE_ENV === 'production'

const CONFIG = {
    BACKEND_BASE_URL: PRODUCTION ? '/api' : 'http://localhost/api',
    COMPLETE_TIMEOUT: PRODUCTION ? process.env.REACT_APP_COMPLETE_TIMEOUT : 5,
    SENTRY_DSN: PRODUCTION ? process.env.REACT_APP_SENTRY_DSN : null,
    DEBUG: PRODUCTION ? false : true,
}

for (let item in CONFIG) {
    if (CONFIG.hasOwnProperty(item) && CONFIG[item] === undefined) { // when property was NOT set
        throw new Error(`Please specify REACT_APP_${item} in the .env file.`)
    }
}

const _console = {...window.console}

console.log = (...args) => {
    if (CONFIG.DEBUG) _console.log(...args)
}

console.warn = (...args) => {
    if (CONFIG.DEBUG) _console.warn(...args)
}

console.error = (...args) => {
    if (CONFIG.DEBUG) _console.error(...args)
}

export default CONFIG
