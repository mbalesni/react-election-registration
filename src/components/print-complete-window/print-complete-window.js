import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import Timer from './timer'

function Transition(props) {
    return <Slide direction="up" {...props} />;
}
// get check_in_session_token from props
export default class PrintCompleteWindow extends React.Component {
    state = {
        timer: 60,
        open: true,
    }

    handleClose = () => {
        this.setState({ open: false });
    }

    onTimerElapsed = () => {
        this.props.onCompleteSession({ auto: true })
    }

    onComplete = () => {
        this.setState({

        })
        this.props.onCompleteSession({ auto: false })
    }

    render() {
        const { onComplete } = this.props

        return (
            <div>
                <Dialog
                    open={this.state.open}
                    TransitionComponent={Transition}
                    keepMounted
                    aria-labelledby="alert-dialog-slide-title"
                    aria-describedby="alert-dialog-slide-description"
                >
                    <DialogTitle id="alert-dialog-slide-title">
                        {"Бюлетень друкується"}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-slide-description">
                            Заповніть бюлетень та завершіть сесію.

                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.onComplete} color="primary" variant="contained">
                            Завершити
                            <Timer style={{ marginLeft: '.5rem' }} onElapsed={this.onTimerElapsed} startAtSeconds={60} />
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}