import React, { useEffect, useCallback } from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Slide from '@material-ui/core/Slide'
import useStoreon from 'storeon/react'
import './index.css'

function Transition(props) {
    return <Slide direction="up" {...props} />
}

const CLOSE_TIMEOUT = 3 * 1000

export default function SessionCompleteWindow({ open }) {
    const { dispatch, session } = useStoreon('session')
    const { activeStudent } = session
    
    const handleClose = useCallback(() => {
        dispatch('session/end')
    }, [dispatch])

    useEffect(() => {
        if (open === true) var a = setTimeout(handleClose, CLOSE_TIMEOUT) 
        return () => window.clearTimeout(a)
    }, [open, handleClose])

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
                    {activeStudent.name || ''}
                </DialogTitle>
                <DialogContentText style={{ margin: '1rem 0' }}>
                    Зареєстровано
                </DialogContentText>
            </DialogContent>
        </Dialog >
    )
}
