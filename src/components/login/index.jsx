import React from 'react'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import FormHelperText from '@material-ui/core/FormHelperText'
import CircularProgress from '@material-ui/core/CircularProgress'
import { handleApiError, handleErrorCode } from '../../errors'
import { API } from '../../config'
import Raven from 'raven-js'
import './index.css'
import store from '../../store'
import CONFIG from '../../config'

const fieldStyle = {
    marginBottom: '.5rem',
}

const buttonStyle = {
    marginTop: '.5rem',
}

const Spinner = () => (
    <CircularProgress
        style={{ marginLeft: '.5rem', color: '#fff' }}
        color="inherit"
        size={20}
    />
)

export default class Login extends React.Component {
    state = {
        username: '',
        password: '',
        loading: false,
    }

    render() {
        const { loading } = this.state
        return (
            <form onSubmit={e => e.preventDefault()} className="login-window">
                <Typography style={{ marginBottom: '.5rem' }} variant="h6">
                    Election Officer Sign In
                </Typography>
                <TextField
                    label="Username"
                    onChange={event =>
                        this.setState({ username: event.target.value })
                    }
                    style={fieldStyle}
                    helperText="Provide your favorite username"
                />
                <TextField
                    label="Password"
                    type="password"
                    style={fieldStyle}
                    onChange={event =>
                        this.setState({ password: event.target.value })
                    }
                    helperText="Any password will do. It's a demo, isn't it?"
                />
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    style={buttonStyle}
                    onClick={this.login.bind(this)}
                >
                    Log In
                    {loading && <Spinner />}
                </Button>
                <FormHelperText
                    style={{
                        marginTop: '1rem',
                        lineHeight: '1.3',
                        textAlign: 'center',
                    }}
                >
                    Or go to the{' '}
                    <a
                        style={{ fontSize: 'inherit', color: '#f44336' }}
                        href={CONFIG.ADMIN_PANEL_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        admin panel
                    </a>
                    .
                </FormHelperText>
            </form>
        )
    }

    login() {
        const { username, password } = this.state
        if (!username || !password) return

        console.log('Log-in attempt into user: ' + username)
        let payload = {}
        try {
            payload = { username, password: btoa(password) }
        } catch (err) {
            alert('Please check if your password is correct.')
            return
        }

        this.setState({ loading: true })
        API.regback
            .post('/login', payload)
            .then(res => {
                if (res.data.error) return handleErrorCode(res.data.error.code)
                store.dispatch('auth/get')
                Raven.captureMessage(`Successful log-in – ${username}`)
            })
            .catch(err => {
                handleApiError(err)
            })
            .finally(() => {
                this.setState({ loading: false })
            })
    }
}
