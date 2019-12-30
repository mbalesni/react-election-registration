import React, { useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Slide from '@material-ui/core/Slide'
import signature from './signature.png'
import { isMobileScreen } from '../../utils/functions'
import Checkbox from '@material-ui/core/Checkbox';
import useStoreon from 'storeon/react'

function Transition(props) {
    return <Slide direction='up' {...props} />
}

function ConsentItem({ checked, onChange, name, label, }) {
    return (
        <FormControlLabel
            control={(
                <Checkbox
                    checked={checked}
                    onChange={() => onChange(!checked)}
                    value={name}
                />
            )}
            label={label}
        />
    )
}

export default function ConsentDialog(props) {
    const [privacyConsent, setPrivacyConsent] = useState(false)
    const { appGlobal: { isOnline }, dispatch } = useStoreon('auth', 'appGlobal')

    const handleClose = () => {
        dispatch('session/cancelConsent')
    }

    const handleComplete = () => {
        dispatch('session/confirmConsent')
    }

    const confirmedConsent = privacyConsent
    const fullScreen = isMobileScreen()

    return (
        <Dialog
            open={true}
            TransitionComponent={Transition}
            aria-labelledby='alert-dialog-slide-title'
            aria-describedby='alert-dialog-slide-description'
            fullScreen={fullScreen}
        >
            <DialogTitle id='alert-dialog-slide-title' style={{ textAlign: 'center' }}>
                Do you agree to the processing of your personal data?
            </DialogTitle>
            <DialogContent>


                <DialogContentText id='alert-dialog-slide-description'>
                    <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', margin: '1rem 0 2rem' }}>
                        <img style={{ maxHeight: '80px' }} src={signature} alt='Agreement Logo' />
                    </span>
                </DialogContentText>
                <FormControl component='fieldset'>
                    <FormGroup>
                        <ConsentItem
                            checked={privacyConsent}
                            onChange={setPrivacyConsent}
                            name='privacyConsent'
                            label='I agree to the processing of my personal data.'
                        />
                        <br />
                    </FormGroup>
                </FormControl>
            </DialogContent>
            <DialogActions style={{ padding: '.5rem' }}>
                <Button disabled={!isOnline} onClick={handleClose} color='primary' variant='text'>
                    Cancel
                </Button>
                <Button disabled={!confirmedConsent || !isOnline} onClick={handleComplete} color='primary' variant='contained'>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog >
    )

}
