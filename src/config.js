const PRODUCTION = process.env.NODE_ENV === 'production'

const CONFIG = {
    BACKEND_BASE_URL: PRODUCTION ? process.env.REACT_APP_BACKEND_BASE_URL : 'http://localhost/api',
    COMPLETE_TIMEOUT: PRODUCTION ? process.env.REACT_APP_COMPLETE_TIMEOUT : 5,
}

for (let item in CONFIG) {
    if (CONFIG.hasOwnProperty(item) && !CONFIG[item]) {
        throw new Error(`Please specify REACT_APP_${item} in the .env file.`)
    }
}

export default CONFIG
