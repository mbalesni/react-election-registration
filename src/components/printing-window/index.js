import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Slide from '@material-ui/core/Slide'
import CircularProgress from '@material-ui/core/CircularProgress'
import Timer from '../timer'
import CONFIG from '../../config'
import { ICONS } from '../../utils/icons'
import useStoreon from 'storeon/react'
import './index.css'

function Transition(props) {
    return <Slide direction="up" {...props} />
}

const timerStyles = {
    marginLeft: '.5rem'
}

const { COMPLETE_TIMEOUT } = CONFIG

export default function PrintingWindow(props) {
    const [open, setOpen] = useState(true)
    const { printer, dispatch } = useStoreon('printer')
    const { ballotIsPrinted, error } = printer

    const onTimerElapsed = () => {
        setOpen(false)
        dispatch('session/complete', { auto: true })
    }

    const onComplete = () => {
        setOpen(false)
        dispatch('session/complete', { auto: false })
    }

    const onPrintFail = () => {
        dispatch('printer/printFailAccept')
        setOpen(false)
    }

    let title = 'Бюлетень друкується'
    let showSpinner = true
    let instructions = null
    if (ballotIsPrinted) {
        title = 'Бюлетень надруковано'
        showSpinner = false
        instructions = 'Заповніть бюлетень та завершіть сесію.'
    }
    if (error) {
        title = 'Помилка при друкуванні бюлетеня'
        showSpinner = false
        instructions = error
    }

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            aria-labelledby="alert-dialog-slide-title"
            aria-describedby="alert-dialog-slide-description"
        >
            <DialogTitle id="alert-dialog-slide-title">
                {error && <i className={ICONS.errorIcon} style={{ color: 'rgb(225, 82, 64)', marginRight: '.5rem' }}></i>}
                {ballotIsPrinted && <i className={ICONS.scannedIcon} style={{ color: '#2196f3', marginRight: '.5rem' }}></i>}

                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-slide-description">
                    <p>{instructions}</p>
                </DialogContentText>
                {showSpinner && <CircularProgress style={{ margin: '0 auto', display: 'block' }} />}
            </DialogContent>
            <DialogActions style={{ padding: '.5rem' }}>
                {ballotIsPrinted && <Button onClick={onComplete} color="primary" variant="contained">
                    Завершити
                            <Timer style={timerStyles} onElapsed={onTimerElapsed} timeout={COMPLETE_TIMEOUT} />
                </Button>}
                {error && <Button onClick={onPrintFail} color="primary" variant="contained">
                    Повторити реєстрацію
                        </Button>}
            </DialogActions>
        </Dialog>
    )
}
