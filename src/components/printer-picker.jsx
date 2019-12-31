import React, { useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Slide from '@material-ui/core/Slide'
import { ICONS } from '../utils/icons'
import useStoreon from 'storeon/react'
import styled, { css } from 'styled-components'

function Transition(props) {
    return <Slide direction="up" {...props} />
}

const Printer = ({ name, id, onPick, picked }) => {
    function pick() {
        onPick(id)
    }

    const PrinterItem = styled.li`
        align-items: center;
        border-radius: 30px;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        list-style-type: none;
        padding: 1rem;
        margin-bottom: 1rem;

        &:hover {
            background-color: #eee;
        }

        ${props =>
            props.picked &&
            css`
                && {
                    background-color: #2196f3;
                    color: #fff;
                }
            `}
    `

    return (
        <PrinterItem picked={picked} onClick={pick}>
            <i className={ICONS}></i>
            {name}
        </PrinterItem>
    )
}

export default function PrinterPicker(props) {
    const [open, setOpen] = useState(true)
    const [choice, setChoice] = useState(null)
    const { printer, dispatch } = useStoreon('printer')
    const { listOfPrinters } = printer

    const onPick = id => {
        setChoice(id)
    }

    const confirm = () => {
        setOpen(false)
        dispatch('printer/pickPrinter', choice)
    }

    const printers = listOfPrinters.map(printer => (
        <Printer
            key={printer[1]}
            id={printer[1]}
            picked={choice === printer[1]}
            name={printer[0]}
            onPick={onPick}
        />
    ))

    const buttonDisabled = choice === null

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            aria-labelledby="alert-dialog-slide-title"
            aria-describedby="alert-dialog-slide-description"
        >
            <DialogTitle id="alert-dialog-slide-title">
                Select a printer for ballot printing
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-slide-description">
                    {printers}
                </DialogContentText>
            </DialogContent>
            <DialogActions style={{ padding: '.5rem' }}>
                <Button
                    disabled={buttonDisabled}
                    onClick={confirm}
                    color="primary"
                    variant="contained"
                >
                    Select printer
                </Button>
            </DialogActions>
        </Dialog>
    )
}
