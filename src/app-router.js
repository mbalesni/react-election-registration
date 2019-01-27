import React from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import App from './app.js'
import LoginPage from './login-page.js'
import axios from 'axios'

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL || 'http://localhost:8000'

export default class AppRouter extends React.Component {
  constructor(props) {
    super(props)

    this.state = {

    }
    axios.defaults.baseURL = BASE_URL
    axios.defaults.withCredentials = true

  }

  render() {
    return (
      <Router>
        <div>
          <Route path="/" exact component={App} onEnter={this.requireAuth.bind(this)} />
          <Route path="/login" component={LoginPage} />
        </div>
      </Router>
    )
  }

  loggedIn() {
    axios.post
  }

  async requireAuth(nextState, replace) {
    axios.post('/me')
      .then(res => {
        console.log('already logged in')
        replace({
          pathname: '/login'
        })
      })
      .catch(err => {
        console.warn('err while checking auth')
      })
  }
}
