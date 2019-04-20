import React, { useState, useEffect } from 'react'
import { Button, Radio, RadioGroup, FormLabel, FormControl, FormControlLabel, Input } from '@material-ui/core'
import IconButton from '@material-ui/core/IconButton'
import PhotoCamera from '@material-ui/icons/PhotoCamera'
import { ICONS } from '../../utils/icons.js'
import iziToast from 'izitoast'
import Video from '../scanner'
import './index.css'

const Fragment = React.Fragment

const MIN_LENGTH = {
    '0': 8,     // ticket
    '1': 3,     // gradebook
    '2': 3,     // certificate
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
            value: event.target.value
        })
    }

    const validate = (docNumber) => {
        const docType = state.value
        // true condition means error
        // string is error explanation
        let result = (docNumber.length < MIN_LENGTH[docType] || docNumber.length > MAX_LENGTH[docType]) ? `Перевірте правильність номеру ${docNameByValue(docType)}.` : ''
        console.log(docNumber, docType, result)
        return result
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
            this.handleSubmit()
        } else return
    }

    const handleDocNumberChange = (e) => {
        let docNumber = e.target.value
        console.log('handling doc number change', state, docNumber, { ...state, docNumber })
        setState({
            ...state,
            docNumber
        })
    }

    useEffect(() => {
        console.log('using effect')
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

    const disabled = props.loading || validate(docNumber)

    const shouldMarkError = (field) => {
        const hasError = error.length > 0
        const shouldShow = state.touched

        const result = hasError ? shouldShow : false
        return result
    }

    // const iconRight = {
    //     marginRight: '8px',
    //     marginBottom: '2px',
    //     fontSize: '18px'
    // }

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
                            value={state.docNumber}
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
                Підтвердити
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
