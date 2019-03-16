import React from 'react'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import CircularProgress from '@material-ui/core/CircularProgress'
import { ICONS } from './utils/icons.js'
import * as ERRORS from './utils/errors.json';
import axios from 'axios'
import izitoast from 'izitoast'
import './login-window.css'

const fieldStyle = {
    marginBottom: '1rem',
}

const buttonStyle = {
    marginTop: '1rem'
}

const Spinner = () => (
    <CircularProgress style={{ marginLeft: '.5rem', color: '#fff' }} color="inherit" size={20} />
)

export default class LoginWindow extends React.Component {
    state = {
        username: '',
        password: '',
        loading: false
    }

    componentDidMount() {
        const authToken = localStorage.getItem('authToken')
        if (authToken) {
            this.props.onSuccess(authToken)
        }
    }

    render() {
        const { loading } = this.state
        return (
            <form onSubmit={(e) => e.preventDefault()}>
                <div className="login-window">
                    <Typography style={{ marginBottom: '.5rem' }} variant="h6" >Авторизуватися</Typography>
                    <TextField
                        label="Ім'я користувача"
                        onChange={(event) => this.setState({ username: event.target.value })}
                        style={fieldStyle}
                    />
                    <TextField
                        label="Пароль"
                        type="password"
                        style={fieldStyle}
                        onChange={(event) => this.setState({ password: event.target.value })}
                    />
                    <Button variant="contained" color="primary" type="submit" style={buttonStyle} onClick={this.login.bind(this)} >
                        Увійти
                        {loading && <Spinner />}
                    </Button>
                </div>
            </form>
        )
    }

    login() {
        this.setState({ loading: true })
        const apiBaseUrl = this.props.url
        const { username, password } = this.state
        const payload = { username, password: btoa(password) }

        axios.post(apiBaseUrl + '/login', payload)
            .then(response => {
                console.log(response)

                const authToken = response.data.auth_token
                this.setState({ loading: false })                
                if (authToken) {
                    console.log("Login successfull")
                    localStorage.setItem('authToken', authToken)
                    this.props.onSuccess(authToken)
                }
                else if (response.data.error.code === 515) {
                    console.log("Username password do not match")
                    let error = ERRORS[515]
                    izitoast.show({
                        title: error.title,
                        message: error.message,
                        icon: ICONS.login,
                        iconColor: '#fff',
                        backgroundColor: '#E15240',
                        position: 'topRight',
                        titleColor: '#fff',
                        messageColor: '#fff',
                        maxWidth: '350px',
                        layout: 2,
                        timeout: 30 * 1000,
                        transitionIn: 'bounceInLeft',
                        resetOnHover: true,
                        progressBar: true,
                        drag: false,
                      })
                }
                else {
                    console.log("Unexpected response")
                    alert("Непередбачена відповідь.")
                }
            })
            .catch(err => {
                this.setState({ loading: false })
                console.log(err)
            })
    }
}