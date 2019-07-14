import React, { useState, useEffect } from 'react'
import { Button, Radio, RadioGroup, FormLabel, FormControl, FormControlLabel, Input } from '@material-ui/core'
import IconButton from '@material-ui/core/IconButton'
import PhotoCamera from '@material-ui/icons/PhotoCamera'
import { ICONS } from '../../utils/icons.js'
import iziToast from 'izitoast'
import Video from '../scanner'
import CONFIG from '../../config'
import './index.css'

const { PRINT_BALLOTS } = CONFIG
const SUBMIT_BTN_NAME = PRINT_BALLOTS ? 'Надрукувати бюлетень' : 'Підтвердити'

const MIN_LENGTH = {
    '0': 8,     // ticket
    '1': 1,     // gradebook
    '2': 1,     // certificate
}

const MAX_LENGTH = {
    '0': 8,     // ticket
    '1': 8,     // gradebook
    '2': 8,     // certificate
}

const initialState = {
    value: '0',
    docNumber: '',
    touched: false,
    isScanning: false,
    submitted: false,
}


export default function DocInput(props) {
    const [state, setState] = useState(initialState)

    const handleChange = event => {
        setState({
            ...state,
            value: event.target.value,
            docNumber: '',
            touched: false,
        })
    }

    const validate = (docNumber) => {
        const docType = state.value
        const len = docNumber.length
        const minLen = MIN_LENGTH[docType]
        const maxLen = MAX_LENGTH[docType]

        const lengthInvalid = len < minLen || len > maxLen
        const typeInvalid = docType === '0' && (isNaN(parseInt(docNumber)) || parseInt(docNumber).toString().length !== docNumber.length)

        return lengthInvalid || typeInvalid
    }

    const handleBlur = (field) => (evt) => {
        setState({
            ...state,
            touched: true,
        })
    }

    const handleSubmit = () => {
        const docNumber = state.docNumber
        const docType = state.value

        const error = validate(docNumber)

        if (error) {
            let text = ''
            text += `Перевірте правильність номеру ${docNameByValue(docType)}.`

            console.warn(text)
            iziToast.show({
                message: `Перевірте правильність номеру ${docNameByValue(docType)}.`,
                icon: ICONS.errorIcon,
                iconColor: 'orange',
                position: 'topRight',
                progressBar: false,
                animateInside: false,
                transitionIn: 'bounceInLeft',
            })
        } else {
            let student = { ...props.activeStudent }
            student.docType = docType
            student.docNumber = docNumber
            props.onSubmit(student)
        }
    }

    const handleStartScan = () => {
        props.onScanStart()
        setState({
            ...state,
            isScanning: true
        })
    }

    const handleCancelScan = () => {
        props.onScanCancel()
        setState({
            ...state,
            isScanning: false
        })
    }

    const handleSubmitOnEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        } else return
    }

    const handleDocNumberChange = (e) => {
        let docNumber = e.target.value
        setState({
            ...state,
            docNumber
        })
    }

    useEffect(() => {
        setState({
            ...state,
            docNumber: props.activeStudent.docNumber,
            isScanning: false,
        })
    }, [props.activeStudent.docNumber, props.scannerSeed])

    const { value } = state
    const docNumber = state.docNumber || ''

    const error = validate(docNumber)

    const screenWidth = window.innerWidth

    const isSmScreen = screenWidth < 600

    const disabled = props.loading || Boolean(validate(docNumber))

    const shouldMarkError = (field) => {
        const hasError = error.length > 0
        const shouldShow = state.touched

        const result = hasError ? shouldShow : false
        return result
    }

    const startAdornment = {
        marginTop: 0,
        marginRight: 0,
        opacity: .6,
    }

    let byTicket = (value === '0')

    return (
        <>
            <div className="doc-picker">
                <FormControl component="fieldset">
                    <FormLabel component="legend">Тип документа</FormLabel>
                    <RadioGroup
                        aria-label="Тип документа"
                        name="docType"
                        value={value}
                        onChange={handleChange}
                    >
                        <FormControlLabel value="0" control={<Radio />} label="Студентський квиток" />
                        <FormControlLabel value="1" control={<Radio />} label="Залікова книжка" />
                        <FormControlLabel value="2" control={<Radio />} label="Довідка" />
                    </RadioGroup>

                </FormControl>

                <div>
                    <div className="doc-number-field" style={!isSmScreen ? { marginTop: 24 + (48 * value) } : { marginTop: 24 }}>

                        <Input
                            className="input doc-number"
                            disabled={props.loading}
                            error={shouldMarkError('docNumber')}
                            placeholder={"Номер " + docNameByValue(value)}
                            value={docNumber}
                            fullWidth={true}
                            onChange={handleDocNumberChange}
                            onBlur={handleBlur('docNumber')}
                            tabIndex="0"
                            onKeyPress={handleSubmitOnEnter}
                            startAdornment={byTicket && <span style={startAdornment}>KB</span>}
                        />

                        {byTicket &&
                            <IconButton
                                color="primary"
                                component="span"
                                style={{ marginTop: -6 }}
                                onClick={handleStartScan}
                            >
                                <PhotoCamera />
                            </IconButton>
                        }
                    </div>
                </div>

            </div>

            <Button
                className="print-btn"
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={disabled}
                style={{ marginTop: '1rem' }}
            >
                {SUBMIT_BTN_NAME}
            </Button>

            {byTicket &&
                <Video
                    onCancel={handleCancelScan}
                    show={state.isScanning}
                    loading={props.loading}
                />
            }
        </>
    )
}

function docNameByValue(value) {
    let name
    switch (value) {
        case '0':
            name = 'студентського'
            break
        case '1':
            name = 'залікової книжки'
            break
        case '2':
            name = 'довідки'
            break
        default:
            name = 'документа'
    }
    return name

}
