import React from 'react'
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


export default function SessionComplete(props) {
    const handleClose = () => {
        props.onSessionEnd()
        console.log('closing window')
    }

    return (
        <Dialog
            open={true}
            TransitionComponent={Transition}
            keepMounted
            aria-labelledby="alert-dialog-slide-title"
            aria-describedby="alert-dialog-slide-description"
            className="ballot-dialog"
        >
            <DialogTitle id="alert-dialog-slide-title">
                Сесія завершена
                </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-slide-description" style={{ textAlign: 'center' }}>
                    <i style={{ fontSize: '5rem', color: '#4CAF50' }} className="fas fa-check-circle" />
                </DialogContentText>
                <DialogContentText style={{ marginTop: '1rem', textAlign: 'center' }}>
                    {props.studentName}
                </DialogContentText>
            </DialogContent>
            <DialogActions style={{ padding: '.5rem' }}>
                <Button onClick={handleClose} style={{ width: '100%' }} color="primary" variant="contained">
                    Закрити
                    </Button>
            </DialogActions>
        </Dialog >
    )


}
