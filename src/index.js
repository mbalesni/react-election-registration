import React from 'react'
import ReactDOM from 'react-dom'
import Raven from 'raven-js'
import './utils/reset-styles.css'
import './utils/index.css'
import '@fortawesome/fontawesome-free/css/all.css'
import App from './app'
import CONFIG from './config'

if (CONFIG.SENTRY_DSN) Raven.config(CONFIG.SENTRY_DSN).install()

ReactDOM.render(<App />, document.getElementById('root'))
