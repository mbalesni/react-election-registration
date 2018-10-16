import React from 'react'
import ReactDOM from 'react-dom'
import Raven from 'raven-js'
import './css/reset-styles.css'
import './css/index.css'
import './css/fontawesome-all.min.css'
import ELists from './e-lists.js'


const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || ''

Raven.config(SENTRY_DSN).install()

ReactDOM.render(<ELists />, document.getElementById('root'))
