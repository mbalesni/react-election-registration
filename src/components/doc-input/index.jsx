import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button'
import FormControl from '@material-ui/core/FormControl'
import Input from '@material-ui/core/Input'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import { ICONS } from '../../utils/icons.js'
import iziToast from 'izitoast'
import CONFIG from '../../config'
import useStoreon from 'storeon/react'
import './index.css'

const { PRINT_BALLOTS } = CONFIG
const SUBMIT_BTN_NAME = PRINT_BALLOTS ? 'Print ballot' : 'Confirm'

const MIN_LENGTH = {
    '0': 8, // ticket
    '1': 1, // gradebook
    '2': 1, // certificate
}

const MAX_LENGTH = {
    '0': 8, // ticket
    '1': 8, // gradebook
    '2': 8, // certificate
}

const initialState = {
    docNumber: '',
    touched: false,
    isScanning: false,
    submitted: false,
}

function doesIncludeNotDigits(string) {
    const reg = new RegExp(/[^0-9]+/gm)
    return reg.test(string)
}

export default function DocInput() {
    const [docType, setDocType] = useState(0)
    const [state, setState] = useState(initialState)
    const { appGlobal, session, dispatch } = useStoreon('session', 'appGlobal')
    const { activeStudent } = session
    const { loading, isOnline } = appGlobal

    const handleDocTypeChange = (e, newValue) => {
        setDocType(newValue)
    }

    const validate = docNumber => {
        const len = docNumber.length
        const minLen = MIN_LENGTH[docType]
        const maxLen = MAX_LENGTH[docType]

        const invalidLength = len < minLen || len > maxLen
        const invalidCharacters =
            docType === 0 && doesIncludeNotDigits(docNumber)

        return invalidLength || invalidCharacters
    }

    const handleBlur = field => evt => {
        setState({
            ...state,
            touched: true,
        })
    }

    const handleSubmit = () => {
        const docNumber = state.docNumber
        const error = validate(docNumber)

        if (error) {
            let message = `Check the correctness of the ${docNameByValue(
                docType
            )} number.`
            console.warn(message)

            iziToast.show({
                message,
                icon: ICONS.errorIcon,
                iconColor: 'orange',
                position: 'topRight',
                progressBar: false,
                animateInside: false,
                transitionIn: 'bounceInLeft',
            })
        } else {
            let student = { ...activeStudent }
            student.docType = docType
            student.docNumber = docNumber
            dispatch('session/issueBallot', student)
        }
    }

    const handleSubmitOnEnter = e => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        } else return
    }

    const handleDocNumberChange = e => {
        let docNumber = e.target.value
        setState({
            ...state,
            docNumber,
        })
    }

    useEffect(() => {
        setState(state => ({
            ...state,
            docNumber: activeStudent.docNumber,
            isScanning: false,
        }))
    }, [activeStudent.docNumber])

    const docNumber = state.docNumber || ''
    const error = validate(docNumber)
    const disabled = !isOnline || loading || Boolean(validate(docNumber))

    const shouldMarkError = () => {
        const dirty = state.touched
        const hasError = error.length > 0

        return dirty && hasError
    }

    const startAdornment = {
        marginTop: 0,
        marginRight: 0,
        opacity: 0.6,
    }

    let byTicket = docType === 0

    return (
        <>
            <div className="doc-picker">
                <FormControl component="fieldset" style={{ width: '100%' }}>
                    <Tabs
                        value={docType}
                        onChange={handleDocTypeChange}
                        indicatorColor="primary"
                        textColor="primary"
                        className="doc-types-tabs"
                    >
                        <Tab
                            label="Student ID"
                            icon={<i className={ICONS.studentCard}></i>}
                        />
                        <Tab
                            label="Gradebook"
                            icon={<i className={ICONS.gradeBook}></i>}
                        />
                        <Tab
                            label="Certificate"
                            icon={<i className={ICONS.certificate}></i>}
                        />
                    </Tabs>
                </FormControl>

                <div>
                    <div className="doc-number-field">
                        <Input
                            className="input doc-number"
                            disabled={loading}
                            error={shouldMarkError('docNumber')}
                            placeholder={docNameByValue(docType) + ' number'}
                            value={docNumber}
                            fullWidth={true}
                            onChange={handleDocNumberChange}
                            onBlur={handleBlur('docNumber')}
                            tabIndex="0"
                            onKeyPress={handleSubmitOnEnter}
                            startAdornment={
                                byTicket && (
                                    <span style={startAdornment}>KB</span>
                                )
                            }
                        />
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
        </>
    )
}

function docNameByValue(value) {
    let name
    switch (value) {
        case 0:
            name = 'student ID'
            break
        case 1:
            name = 'gradebook'
            break
        case 2:
            name = 'certificate'
            break
        default:
            name = 'document'
    }
    return name
}
