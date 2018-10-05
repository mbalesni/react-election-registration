import React from 'react'
import Button from '@material-ui/core/Button'
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Video from './video.js'

const Fragment = React.Fragment

const MIN_LENGTH = 3


export class StudentDocInput extends React.Component {
    state = {
        value: '0',
        docNumber: {
            value: '',
            label: `номер документа`,
            name: 'docNumber'
        },
        touched: false,
        isScanning: false
    }

    handleChange = event => {
        console.log(event)
        console.log(event.target.value)
        this.setState({ value: event.target.value })
    }

    validate(docNumber) {
        // true condition means error
        // string is error explanation
        return {
            docNumber: docNumber.length < MIN_LENGTH.docNumber && `Номер документа повинен бути ${MIN_LENGTH.docNumber} або більше символів в довжину` || '',
        }
    }

    handleBlur = (field) => (evt) => {
        this.setState({
            touched: true,
        })
    }

    handleSubmit(e) {
        // const { docNumber } = this.state
        // const errors = this.validate(docNumber.value)

        // let allTouched = { ...this.state.touched }
        // Object.keys(allTouched).forEach(key => {
        //     allTouched[key] = true
        // })
        // this.setState({ touched: allTouched })


        // let noErrors = true

        // const fields = [name]

        // fields.forEach(field => {
        //     const hasError = errors[field.name].length > 0

        //     if (hasError) {
        //         noErrors = false

        //         let text = ''
        //         text += `${capitalize(field.label)} має бути довше ${MIN_LENGTH[field.name] - 1} символів`

        //         if (field.name === 'name') text += `, починатися з великої літери, та включати пробіл`
        //         message.warn(text)
        //     }

        // })

        // if (noErrors) this.search()

    }

    handleStartScan() {
        this.props.onScanStart()
        this.setState({ isScanning: true })
    }

    handleSubmitOnEnter(e) {
        if (e.key === 'Enter') {
            e.preventDefault()
            this.handleSubmit()
        } else return
    }

    render() {
        const { value } = this.state
        const docNumber = this.props.activeStudent.docNumber || ''

        const iconRight = {
            marginRight: '8px',
            marginBottom: '2px',
            fontSize: '18px'
        }

        let scanBtn = (value === '0')

        return (
            <Fragment>
                <div className="doc-type-picker">
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Тип документа</FormLabel>
                        <RadioGroup
                            aria-label="Тип документа"
                            name="docType"
                            value={value}
                            onChange={this.handleChange}
                        >
                            <FormControlLabel value="0" control={<Radio />} label="Студентський квиток" />
                            <FormControlLabel value="1" control={<Radio />} label="Заліковка" />
                            <FormControlLabel value="2" control={<Radio />} label="Довідка" />
                        </RadioGroup>

                    </FormControl>

                </div>

                {scanBtn &&
                    <Button
                        className="scan-btn"
                        onClick={this.handleStartScan.bind(this)}
                        variant="contained"
                        color="primary"
                    >
                        <Fragment>
                            <i className="fas fa-camera" style={iconRight}></i>
                            сканувати
                        </Fragment>
                    </Button>
                }

                {!scanBtn &&
                    <Button
                        className="scan-btn"
                        variant="contained"
                        color="primary"
                    >
                        підтвердити
                    </Button>
                }

                {value === '0'  &&
                    <Video show={this.state.isScanning && docNumber.length === 0} onCancelSession={this.props.onCancelSession} />
                }

            </Fragment>
        )
    }
}
