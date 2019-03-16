import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Slide from '@material-ui/core/Slide'
import CircularProgress from '@material-ui/core/CircularProgress'
import Timer from './timer'
import { ICONS } from '../../utils/icons'

function Transition(props) {
    return <Slide direction="up" {...props} />
}

const timerStyles = {
    marginLeft: '.5rem'
}

const PRINT_COMPLETE_TIMEOUT = process.env.REACT_APP_PRINT_COMPLETE_TIMEOUT

export default class PrintingWindow extends React.PureComponent {
    state = {
        timer: PRINT_COMPLETE_TIMEOUT,
        open: true,
        error: null,
    }

    handleClose = () => {
        this.setState({ open: false })
    }

    onTimerElapsed = () => {
        this.props.onCompleteSession({ auto: true })
    }

    onComplete = () => {
        this.props.onCompleteSession({ auto: false })
    }

    onPrintFail = () => {
        this.props.onCompleteSession({ auto: false, printFailed: true })
    }

    render() {
        const { ballotPrinted, error } = this.props
        let title = 'Бюлетень друкується'
        let showSpinner = true
        let instructions = null
        if (ballotPrinted) {
            title = 'Бюлетень надруковано'
            showSpinner = false
            instructions = 'Заповніть бюлетень та завершіть сесію.'
        }
        if (error) {
            title = 'Помилка при друкуванні бюлетеня'
            showSpinner = false
            instructions = error.message
        }

        return (
            <Dialog
                open={this.state.open}
                TransitionComponent={Transition}
                keepMounted
                aria-labelledby="alert-dialog-slide-title"
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle id="alert-dialog-slide-title">
                    {error && <i className={ICONS.errorIcon} style={{ color: 'rgb(225, 82, 64)', marginRight: '.5rem' }}></i>}
                    {ballotPrinted && <i className={ICONS.scannedIcon} style={{ color: '#2196f3', marginRight: '.5rem' }}></i>}

                    {title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {instructions}
                    </DialogContentText>
                    {showSpinner && <CircularProgress style={{ margin: '0 auto', display: 'block' }} />}
                </DialogContent>
                <DialogActions style={{ padding: '.5rem' }}>
                    {ballotPrinted && <Button onClick={this.onComplete} color="primary" variant="contained">
                        Завершити
                            <Timer style={timerStyles} onElapsed={this.onTimerElapsed} timeout={PRINT_COMPLETE_TIMEOUT} />
                    </Button>}
                    {error && <Button onClick={this.onPrintFail} color="primary" variant="contained">
                        Повторити реєстрацію
                        </Button>}
                </DialogActions>
            </Dialog>
        )
    }
}