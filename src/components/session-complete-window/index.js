import React, { useEffect } from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Slide from '@material-ui/core/Slide'
import './index.css'

function Transition(props) {
    return <Slide direction="up" {...props} />
}

const CLOSE_TIMEOUT = 3 * 1000

export default function SessionCompleteWindow({ open, onSessionEnd, studentName }) {
    const handleClose = () => {
        onSessionEnd()
    }


    useEffect(() => {
        if (open === true) var a = setTimeout(handleClose, CLOSE_TIMEOUT)
        return () => window.clearTimeout(a)
    }, [open])

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            aria-labelledby="alert-dialog-slide-title"
            aria-describedby="alert-dialog-slide-description"
            className="ballot-dialog"
        >
            <DialogContent style={{ textAlign: 'center' }}>
                <DialogContentText id="alert-dialog-slide-description">
                    <i style={{ fontSize: '5rem', color: '#4CAF50' }} className="fas fa-check-circle" />
                </DialogContentText>
                <DialogTitle>
                    {studentName}
                </DialogTitle>
                <DialogContentText style={{ margin: '1rem 0' }}>
                    Зареєстровано
                </DialogContentText>
            </DialogContent>
        </Dialog >
    )
}
