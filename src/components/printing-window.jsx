import React, { useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Slide from '@material-ui/core/Slide'
import CircularProgress from '@material-ui/core/CircularProgress'
import Timer from './timer'
import CONFIG from '../config'
import { ICONS } from '../utils/icons'
import useStoreon from 'storeon/react'

function Transition(props) {
    return <Slide direction="up" {...props} />
}

const timerStyles = {
    marginLeft: '.5rem',
}

const { COMPLETE_TIMEOUT } = CONFIG

const SpinnerWrapper = () => (
    <div style={{ height: '40px', overflow: 'hidden' }}>
        <CircularProgress />
    </div>
)

export default function PrintingWindow(props) {
    const [open, setOpen] = useState(true)
    const someStore = useStoreon('printer', 'appGlobal')
    const { printer, appGlobal, dispatch } = someStore
    const {
        ballotIsPrinted,
        error,
        isTest,
        number,
        printerIdx,
        listOfPrinters,
    } = printer
    const { isOnline } = appGlobal

    const completeSession = auto => {
        setOpen(false)
        dispatch('printer/printFinished')
        if (!isTest) dispatch('session/complete', { auto })
    }

    const onTimerElapsed = () => {
        completeSession(true)
    }

    const onComplete = () => {
        completeSession(false)
    }

    const onPrintFail = () => {
        dispatch('printer/printFailAccept')
        setOpen(false)
    }

    let title = 'Waiting for printer response'
    let showSpinner = true
    let instructions = null
    if (ballotIsPrinted) {
        title = 'Ballot is printing'
        showSpinner = false
        const currentPrinter = listOfPrinters.find(
            printer => printer[1] === printerIdx
        )
        const printerVerboseName = currentPrinter && currentPrinter[0]
        instructions = isTest ? (
            <>
                <span>Printer:</span>
                <br />
                <strong>
                    #{printerIdx} {printerVerboseName}{' '}
                </strong>
                <br />
                <br />
                <span>Ballot number:</span>
                <br />
                <strong>{number} </strong>
                <br />
                <br />
                <span>
                    Verify the ballot legibility and finish the test print
                </span>
            </>
        ) : (
            'Fill in the ballot and finish the session.'
        )
    }
    if (error) {
        title = 'Error printing the ballot'
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
                {error && (
                    <i
                        className={ICONS.errorIcon}
                        style={{
                            color: 'rgb(225, 82, 64)',
                            marginRight: '.5rem',
                        }}
                    ></i>
                )}
                {ballotIsPrinted && (
                    <i
                        className={ICONS.scannedIcon}
                        style={{ color: '#2196f3', marginRight: '.5rem' }}
                    ></i>
                )}

                {title}
            </DialogTitle>
            <DialogContent
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <DialogContentText id="alert-dialog-slide-description">
                    {instructions}
                </DialogContentText>
                {showSpinner && <SpinnerWrapper />}
            </DialogContent>
            <DialogActions style={{ padding: '.5rem' }}>
                {ballotIsPrinted && (
                    <Button
                        disabled={!isOnline}
                        onClick={onComplete}
                        color="primary"
                        variant="contained"
                    >
                        Finish
                        <Timer
                            style={timerStyles}
                            onElapsed={onTimerElapsed}
                            timeout={COMPLETE_TIMEOUT}
                        />
                    </Button>
                )}
                {error && (
                    <Button
                        disabled={!isOnline}
                        onClick={onPrintFail}
                        color="primary"
                        variant="contained"
                    >
                        Repeat check-in
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}
