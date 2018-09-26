import React from 'react';
import Button from '@material-ui/core/Button'
import Video from './video.js'
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';
import Input from '@material-ui/core/Input';
import './css/studentFinder.css'
import { message } from 'antd'


const MIN_LENGTH = {
  name: 5,
  docNumber: 3
}
const NAME_MIN_LENGTH = 5
const DOCNUMBER_MIN_LENGTH = 3

export default class StudentFinder extends React.Component {
  state = {
    docType: '0',
    isScanning: false,
    value: '0',
    name: {
      value: '',
      label: `ім'я`
    },
    docNumber: {
      value: '',
      label: `номер документа`
    },
    touched: {
      name: false,
      docNumber: false,
    },
  }

  handleChange = event => {
    console.log(event)
    this.setState({ value: event.target.value })
  }

  handleStartScan() {
    this.setState({ isScanning: true })
    this.props.onScanStart()
  }

  handleCancelScan() {
    this.props.onScanCancel()
    this.setState({
      isScanning: false
    })
  }

  handleSearch() {
    console.log('Handling search... ')
    let { name, value, docNumber } = this.state
    this.props.onSearchByName(name.value, value, docNumber.value)

  }

  validate(name, docNumber) {
    // true condition means error
    // string is error explanation
    return {
      name: (name.length < MIN_LENGTH.name || !isTitle(name) || !hasSpaces(name)) && `Ім'я повинно бути ${MIN_LENGTH.name} або більше символів в довжину` || '',
      docNumber: docNumber.length < MIN_LENGTH.docNumber && `Номер документа повинен бути ${MIN_LENGTH.docNumber} або більше символів в довжину` || '',
    }
  }

  handleBlur = (field) => (evt) => {
    this.setState({
      touched: { ...this.state.touched, [field]: true },
    })
  }

  handleSubmitOnEnter(e) {
    if (e.key === 'Enter') {
      const { name, docNumber } = this.state
      const errors = this.validate(name.value, docNumber.value)
      const noErrors = !Object.keys(errors).some(x => errors[x].length > 0)
      console.log('Errors: ', errors)
      console.log('noErrors: ', noErrors)

      if (noErrors) this.handleSearch()
    } else return
  }


  render() {
    const { value, name, docNumber } = this.state

    const errors = this.validate(name.value, docNumber.value)
    const isDisabled = Object.keys(errors).some(x => errors[x].length > 0)

    const shouldMarkError = (field) => {
      const hasError = errors[field].length > 0
      const shouldShow = this.state.touched[field]


      const shouldMarkErrorResult = hasError ? shouldShow : false
      if (shouldMarkErrorResult) {
        let text = ''
        text += `Довжина повинна бути не меншою за ${MIN_LENGTH[field]} символів`
        if (field === 'name') text += `, а ім'я повинно бути з великої літери`
        // message.warn(text)
      } else {
        // message.destroy()
      }


      return shouldMarkErrorResult
    }

    return (
      <div className="student-finder">

        {this.state.isScanning === false && <form >
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

          {value === '0' &&
            <Button
              className="scan-btn"
              onClick={this.handleStartScan.bind(this)}
              variant="contained"
              color="primary"
            >
              почати сканування
            </Button>}

          {value !== '0' &&
            <div className="student-by-name-finder" style={{ marginTop: 20 }}>

              <Input
                className="input student-name"
                error={shouldMarkError('name')}
                placeholder="Повне ім'я"
                value={this.state.name.value}
                fullWidth={true}
                onChange={this.handleNameChange}
                onBlur={this.handleBlur('name')}
                tabIndex="1"
                onKeyPress={this.handleSubmitOnEnter.bind(this)}
              />

              <Input
                className="input doc-number"
                error={shouldMarkError('docNumber')}
                placeholder="Номер документа"
                value={this.state.docNumber.value}
                fullWidth={true}
                onChange={this.handleDocNumberChange}
                onBlur={this.handleBlur('docNumber')}
                tabIndex="2"
                onKeyPress={this.handleSubmitOnEnter.bind(this)}
              />

              <Button
                className="search-btn"
                variant="contained"
                color="primary"
                onClick={this.handleSearch.bind(this)}
                disabled={isDisabled}

              >
                знайти
              </Button>


            </div>}

        </form>}



        {this.state.docType === '0' &&
          <Video show={this.state.isScanning} onScanCancel={this.handleCancelScan.bind(this)} />
        }


      </div>
    )
  }

  handleNameChange = (e) => {
    let nameVal = e.target.value
    let name = {...this.state.name}
    name.value = nameVal
    this.setState({ name })
  }

  handleDocNumberChange = (e) => {
    let docNumberVal = e.target.value
    let docNumber = {...this.state.docNumber}
    docNumber.value = docNumberVal
    this.setState({ docNumber })
  }


}

function toTitleCase(str) {
  return str.replace(
    /\S*/g,
    function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  )
}

function isTitle(str) {
  return str === toTitleCase(str)
}

function hasSpaces(str) {
  return /\s/g.test(str);
}