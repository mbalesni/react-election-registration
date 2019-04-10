import React from 'react'
import NumberBox from './number-box'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Slide from '@material-ui/core/Slide'
import Timer from './timer'
import './ballot.css'

function Transition(props) {
    return <Slide direction="up" {...props} />
}

const timerStyles = {
    marginLeft: '.5rem'
}

const COMPLETE_TIMEOUT = process.env.REACT_APP_COMPLETE_TIMEOUT

export default class Ballot extends React.Component {
    state = {
        timer: COMPLETE_TIMEOUT,
        open: true,
    }

    handleClose = () => {
        this.setState({ open: false })
    }

    onTimerElapsed = () => {
        this.props.onComplete({ auto: true })
    }

    onComplete = () => {
        this.props.onComplete({ auto: false })
    }

    numberBoxes(numArr) {
        return numArr.map((num, index) => <NumberBox key={index} number={num} />)
    }

    render() {
        const { number } = this.props
        const { onComplete, onTimerElapsed } = this
        const numberArr = number.split('-')

        let title = 'Студента зареєстровано'
        let instructions = 'Заповніть бюлетень та завершіть сесію.'

        return (

            <Dialog
                open={this.state.open}
                TransitionComponent={Transition}
                keepMounted
                aria-labelledby="alert-dialog-slide-title"
                aria-describedby="alert-dialog-slide-description"
                className="ballot-dialog"
            >
                <DialogTitle id="alert-dialog-slide-title">
                    <i className='fas fa-check-circle' style={{ color: '#4CAF50', marginRight: '.5rem' }}></i>
                    {title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {instructions}
                        <div className="number-wrapper">
                            <div className="number">{this.numberBoxes(numberArr)}</div>
                        </div>
                    </DialogContentText>
                </DialogContent>
                <DialogActions style={{ padding: '.5rem' }}>
                    <Button onClick={onComplete} color="primary" variant="contained">
                        Завершити
                            <Timer style={timerStyles} onElapsed={onTimerElapsed} timeout={COMPLETE_TIMEOUT} />
                    </Button>
                </DialogActions>
            </Dialog >
        )
    }

}
