import React, { useEffect } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Slide from '@material-ui/core/Slide'
import './ballot.css'

function Transition(props) {
    return <Slide direction="up" {...props} />
}

const CLOSE_TIMEOUT = 3 * 1000

export default function SessionComplete(props) {
    const handleClose = () => {
        props.onSessionEnd()
        console.log('closing window')
    }

    useEffect(() => {
        var a = setTimeout(handleClose, CLOSE_TIMEOUT)
        return () => window.clearTimeout(a)
    }, [])

    return (
        <Dialog
            open={true}
            TransitionComponent={Transition}
            aria-labelledby="alert-dialog-slide-title"
            aria-describedby="alert-dialog-slide-description"
            className="ballot-dialog"
        >
            <DialogContent>
                <DialogContentText id="alert-dialog-slide-description" style={{ textAlign: 'center' }}>
                    <i style={{ fontSize: '5rem', color: '#4CAF50' }} className="fas fa-check-circle" />
                </DialogContentText>
                <DialogTitle>
                {props.studentName}
                </DialogTitle>
                <DialogContentText style={{ marginTop: '1rem', textAlign: 'center' }}>
                Зареєстровано
                </DialogContentText>
            </DialogContent>
        </Dialog >
    )


}
