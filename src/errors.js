import { showNotification } from './utils/functions.js';
import { ICONS } from './utils/icons'
import ERRORS from './utils/errors.json';
import Raven from 'raven-js'
import store from './store'

function handleErrorCode(code, options = {}) {
    if ([517, 518, 519].includes(code)) {
        store.dispatch('auth/expired')
    }

    let error = ERRORS[code] || {
        title: `Упс, такої помилки не очікували`,
        message: 'Команда підтримки вже поінформована про проблему 😌',
        icon: ICONS.bug,
    }

    Raven.captureException(
        options.err || `${error.title} – ${error.message}`,
        {
            user: {
                name: store.get().auth.user
            }
        }
    )

    if (!options.silent) {
        showNotification({
            title: error.title,
            message: error.message,
            icon: error.icon,
        })
    }
}

function handleApiError(err) {
    console.warn('Handling API error:', err)
    if (!err.status && !err.response) return handleErrorCode(513) // network error
    handleErrorCode(300, { err })
}

export { handleErrorCode, handleApiError }




// function handlePrinterError () {
//     this.setState({ showPrintingWindow: false, printerError: null })
// }