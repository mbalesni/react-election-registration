import React from 'react'
import ReactDOM from 'react-dom'
import Raven from 'raven-js'
import 'antd/dist/antd.css';
import './reset-styles.css'
import './index.css'
import './fontawesome-all.min.css'
import App from './app.js'


const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || ''

Raven.config(SENTRY_DSN).install()

ReactDOM.render(<App />, document.getElementById('root'))
