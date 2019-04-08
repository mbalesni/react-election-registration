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
import Link from '@material-ui/core/Link';
import { isMobileScreen } from '../../utils/functions'
import Checkbox from '@material-ui/core/Checkbox';

function Transition(props) {
    return <Slide direction="up" {...props} />
}

function ConsentItem({ checked, onChange, name, label, link, linkLabel }) {
    return (
        <FormControlLabel
            control={(
                <Checkbox
                    checked={checked}
                    onChange={() => onChange(!checked)}
                    value={name}
                />
            )}
            label={(
                <>
                    <span>{label} </span>
                    <Link
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="secondary"
                        style={{ color: '#f44336', fontSize: '.875rem' }}
                    >
                        {linkLabel}
                    </Link>
                </>
            )}
        />
    )
}

export default function ConsentDialog(props) {
    const [privacyConsent, setPrivacyConsent] = useState(false)
    const [publicOfferConsent, setPublicOfferConsent] = useState(false)

    const handleClose = () => {
        props.onCancel()
    }

    const handleComplete = () => {
        props.onComplete()
    }

    const confirmedConsent = privacyConsent && publicOfferConsent
    const { studentName } = props
    const fullScreen = isMobileScreen()

    let instructions = 'Підтвердіть згоду на обробку персональних даних.'

    return (
        <Dialog
            open={true}
            TransitionComponent={Transition}
            aria-labelledby="alert-dialog-slide-title"
            aria-describedby="alert-dialog-slide-description"
            fullScreen={fullScreen}
        >
            <DialogTitle id="alert-dialog-slide-title">
                {/* <i className={ICONS.scannedIcon} style={{ color: '#2196f3', marginRight: '.5rem' }}></i>} */}
                Згода та договір
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-slide-description">
                    {instructions}
                    <br />
                    <br />
                    <FormControl component="fieldset">
                        <FormGroup>
                            <ConsentItem 
                                checked={privacyConsent}
                                onChange={setPrivacyConsent}
                                name="privacyConsent"
                                label={`Я, ${studentName}, прочитав(-ла) та погоджуюсь зі`}
                                link="https://mon.gov.ua/storage/app/media/nauka/horizont/na-obrobku-personalnikh-danikh.pdf"
                                linkLabel="Згодою на обробку персональних даних"
                            />
                            <br />
                            <ConsentItem 
                                checked={publicOfferConsent}
                                onChange={setPublicOfferConsent}
                                name="publicOfferConsent"
                                label={`Я, ${studentName}, прочитав(-ла) та погоджуюсь із`}
                                link="https://mon.gov.ua/storage/app/media/nauka/horizont/na-obrobku-personalnikh-danikh.pdf"
                                linkLabel="Договором публічної оферти"
                            />
                        </FormGroup>
                    </FormControl>
                </DialogContentText>
            </DialogContent>
            <DialogActions style={{ padding: '.5rem' }}>
                <Button onClick={handleClose} color="primary" variant="text">
                    Скасувати
                </Button>
                <Button disabled={!confirmedConsent} onClick={handleComplete} color="primary" variant="contained">
                    Продовжити
                </Button>
            </DialogActions>
        </Dialog >
    )

}
