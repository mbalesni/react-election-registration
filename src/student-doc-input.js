import React from 'react'
import { Button, Radio, RadioGroup, FormLabel, FormControl, FormControlLabel, Input } from '@material-ui/core'
import IconButton from '@material-ui/core/IconButton'
import PhotoCamera from '@material-ui/icons/PhotoCamera'
import { message } from 'antd'
import Video from './video.js'
import './css/student-doc-input.css'

const Fragment = React.Fragment

const MIN_LENGTH = {
    '0': 8,     // ticket
    '1': 3,     // gradebook
    '2': 3,     // certificate
}


export class StudentDocInput extends React.Component {
    state = {
        value: '0',
        docNumber: '',
        touched: false,
        isScanning: false,
        disabled: false,
    }

    handleChange = event => {
        this.setState({ value: event.target.value })
    }

    validate(docNumber) {
        const docType = this.state.value
        // true condition means error
        // string is error explanation
        let result = docNumber.length < MIN_LENGTH[docType] && `Номер документа повинен бути довше ${MIN_LENGTH[docType] - 1} символів` || ''
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
            text += `Номер документа має бути довше ${MIN_LENGTH[docType] - 1} символів`

            message.warn(text)
        } else {
            let student = { ...this.props.activeStudent }
            student.docType = docType
            student.docNumber = docNumber
            this.setState({ disabled: true })
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
        console.log('doc number: ', docNumber)
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
        const { value, disabled } = this.state
        const docNumber = this.props.activeStudent.docNumber || this.state.docNumber || ''

        const error = this.validate(docNumber)

        const shouldMarkError = (field) => {
            const hasError = error.length > 0
            const shouldShow = this.state.touched

            const result = hasError ? shouldShow : false

            return result
        }

        const iconRight = {
            marginRight: '8px',
            marginBottom: '2px',
            fontSize: '18px'
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
                        <div className="doc-number-field" style={{marginTop: 24 + (48 * value) }}>

                            <Input
                                className="input doc-number"
                                error={shouldMarkError('docNumber')}
                                placeholder={"Номер " + docNameByValue(value) }
                                value={this.state.docNumber}
                                fullWidth={true}
                                onChange={this.handleDocNumberChange}
                                onBlur={this.handleBlur('docNumber')}
                                tabIndex="0"
                                onKeyPress={this.handleSubmitOnEnter.bind(this)}
                                startAdornment={byTicket && <span style={{marginTop: 6, marginRight: 3, opacity: .6}}>KB</span>}
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
                    className="submit-btn"
                    variant="contained"
                    color="primary"
                    onClick={this.handleSubmit.bind(this)}
                    disabled={disabled}
                >
                    підтвердити
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
    console.log('getting doc nam by value:', value)
    let name
    switch (value) {
        case '0':
            name = 'квитка'
            break
        case '1':
            name = 'залікової книжки'
            break
        case '2':
            name = 'довідки'
            break
    }
    return name
    
}
