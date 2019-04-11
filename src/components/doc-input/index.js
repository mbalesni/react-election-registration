import React from 'react'
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


export default class DocInput extends React.Component {
    state = {
        value: '0',
        docNumber: '',
        touched: false,
        isScanning: false,
        submitted: false,
    }

    handleChange = event => {
        this.setState({ value: event.target.value })
    }

    validate(docNumber) {
        const docType = this.state.value
        // true condition means error
        // string is error explanation
        let result = (docNumber.length < MIN_LENGTH[docType] || docNumber.length > MAX_LENGTH[docType]) ? `Перевірте правильність номеру ${docNameByValue}.` : ''
        return result
    }

    handleBlur = (field) => (evt) => {
        this.setState({
            touched: true,
        })
    }

    handleSubmit() {
        const { docNumber } = this.state
        const docType = this.state.value

        const error = this.validate(docNumber)

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
            let student = { ...this.props.activeStudent }
            student.docType = docType
            student.docNumber = docNumber
            this.props.onSubmit(student)
        }
    }

    handleStartScan() {
        this.props.onScanStart()
        this.setState({ isScanning: true })
    }

    handleCancelScan() {
        this.props.onScanCancel()
        this.setState({ isScanning: false })
    }

    handleSubmitOnEnter(e) {
        if (e.key === 'Enter') {
            e.preventDefault()
            this.handleSubmit()
        } else return
    }

    handleDocNumberChange = (e) => {
        let docNumber = e.target.value
        this.setState({ docNumber })
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.activeStudent.docNumber && nextProps.activeStudent.docNumber !== prevState.docNumber) {
            // this is setState equivalent
            return ({
                docNumber: nextProps.activeStudent.docNumber,
                isScanning: false
            })
        } else return null
    }

    render() {
        const { value } = this.state
        const docNumber = this.props.activeStudent.docNumber || this.state.docNumber || ''

        const error = this.validate(docNumber)

        const screenWidth = window.innerWidth

        const isSmScreen = screenWidth < 600

        const disabled = this.props.loading || this.validate(docNumber)

        const shouldMarkError = (field) => {
            const hasError = error.length > 0
            const shouldShow = this.state.touched

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
            <Fragment>
                <div className="doc-picker">
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Тип документа</FormLabel>
                        <RadioGroup
                            aria-label="Тип документа"
                            name="docType"
                            value={value}
                            onChange={this.handleChange}
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
                                disabled={this.props.loading}
                                error={shouldMarkError('docNumber')}
                                placeholder={"Номер " + docNameByValue(value)}
                                value={this.state.docNumber}
                                fullWidth={true}
                                onChange={this.handleDocNumberChange}
                                onBlur={this.handleBlur('docNumber')}
                                tabIndex="0"
                                onKeyPress={this.handleSubmitOnEnter.bind(this)}
                                startAdornment={byTicket && <span style={startAdornment}>KB</span>}
                            />

                            {byTicket &&
                                <IconButton
                                    color="primary"
                                    component="span"
                                    style={{ marginTop: -6 }}
                                    onClick={this.handleStartScan.bind(this)}
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
                    onClick={this.handleSubmit.bind(this)}
                    disabled={disabled}
                    style={{ marginTop: '1rem' }}
                >
                    Підтвердити
                </Button>

                {byTicket &&
                    <Video
                        onCancel={this.handleCancelScan.bind(this)}
                        show={this.state.isScanning}
                        loading={this.props.loading}
                    />
                }
            </Fragment>
        )
    }
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
