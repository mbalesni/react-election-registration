import React from 'react'
import ReactDOM from 'react-dom'
import Raven from 'raven-js'
import './utils/reset-styles.css'
import './utils/index.css'
import '@fortawesome/fontawesome-free/css/all.css'
import App from './app'
import CONFIG from './config'
import StoreContext from 'storeon/react/context'
import store from './store'

if (CONFIG.SENTRY_DSN && CONFIG.USE_SENTRY)
    Raven.config(CONFIG.SENTRY_DSN).install()

ReactDOM.render(
    <StoreContext.Provider value={store}>
        <App />
    </StoreContext.Provider>,
    document.getElementById('root')
)
