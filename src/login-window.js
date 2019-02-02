import React from 'react'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import CircularProgress from '@material-ui/core/CircularProgress'
import axios from 'axios'
import './login-window.css'

const fieldStyle = {
    marginBottom: '1rem',
}

const buttonStyle = {
    marginTop: '1rem'
}

const spinner = () => (
    <CircularProgress color="secondary" />
)

export default class LoginWindow extends React.Component {
    state = {
        username: '',
        password: '',
        loading: false
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
                        {loading && <CircularProgress style={{ marginLeft: '.5rem' }} color="#fff" size={20} />}
                    </Button>
                </div>
            </form>
        )
    }

    login() {
        // FIXME: get from env
        this.setState({ loading: true })
        const apiBaseUrl = this.props.url
        const { username, password } = this.state
        const payload = { username, password: btoa(password) }

        axios.post(apiBaseUrl + '/login', payload)
            .then(response => {
                console.log(response)

                const authToken = response.data.auth_token
                if (authToken){
                    if (!response.data.error) {
                        console.log("Login successfull")
                        this.props.onSuccess(authToken)
                    }
                    else if (response.data.error.code === 515) {
                        console.log("Username password do not match")
                        alert("username password do not match")
                    }
                    else {
                        console.log("Unexpected response")
                        alert("Unexpected response")
                    }
                }
            })
            .catch(function (error) {
                console.log(error)
            })
    }
}