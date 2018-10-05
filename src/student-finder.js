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
import { message, Icon } from 'antd'


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
      label: `ім'я`,
      name: 'name'
    },
    docNumber: {
      value: '',
      label: `номер документа`,
      name: 'docNumber'
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

  search() {
    console.log('Handling search... ')
    let { name, value, docNumber } = this.state

    this.props.onSearchByName(name.value, value, docNumber.value)

  }

  validate(name, docNumber) {
    // true condition means error
    // string is error explanation
    return {
      name: (name.length < MIN_LENGTH.name || !isTitle(name) || !hasSpaces(name)) && `Ім'я повинно бути ${MIN_LENGTH.name} або більше символів в довжину` || '',
      // docNumber: docNumber.length < MIN_LENGTH.docNumber && `Номер документа повинен бути ${MIN_LENGTH.docNumber} або більше символів в довжину` || '',
    }
  }

  handleBlur = (field) => (evt) => {
    this.setState({
      touched: { ...this.state.touched, [field]: true },
    })
  }

  handleSubmit(e) {
    const { name, docNumber } = this.state
    const errors = this.validate(name.value, docNumber.value)

    let allTouched = { ...this.state.touched }
    Object.keys(allTouched).forEach(key => {
      allTouched[key] = true
    })
    this.setState({ touched: allTouched })


    let noErrors = true

    const fields = [name]

    fields.forEach(field => {
      const hasError = errors[field.name].length > 0

      if (hasError) {
        noErrors = false

        let text = ''
        text += `${capitalize(field.label)} має бути довше ${MIN_LENGTH[field.name] - 1} символів`

        if (field.name === 'name') text += `, починатися з великої літери, та включати пробіл`
        message.warn(text)
      }

    })

    if (noErrors) this.search()

  }

  handleSubmitOnEnter(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      this.handleSubmit()
    } else return
  }


  render() {
    const { value, name } = this.state

    const errors = this.validate(name.value)
    const isDisabled = Object.keys(errors).some(x => errors[x].length > 0)

    const shouldMarkError = (field) => {
      const hasError = errors[field].length > 0
      const shouldShow = this.state.touched[field]

      const result = hasError ? shouldShow : false

      return result
    }

    const iconRight = {
      marginRight: '8px',
      marginBottom: '2px',
      fontSize: '18px'
    }

    return (
      <div className={"student-finder " + (this.state.isScanning ? 'showVideo' : '')}>

        <form >
          {/* <div className="doc-type-picker">
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

          </div> */}

          {/* {value === '0' &&
            <Button
              className="scan-btn"
              onClick={this.handleStartScan.bind(this)}
              variant="contained"
              color="primary"
            >
              <i className="fas fa-camera" style={iconRight}></i>
              сканувати
            </Button>
          } */}



          <div className="student-by-name-finder">

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

            {/* <Input
                className="input doc-number"
                error={shouldMarkError('docNumber')}
                placeholder="Номер документа"
                value={this.state.docNumber.value}
                fullWidth={true}
                onChange={this.handleDocNumberChange}
                onBlur={this.handleBlur('docNumber')}
                tabIndex="2"
                onKeyPress={this.handleSubmitOnEnter.bind(this)}
              /> */}

            <Button
              className="search-btn"
              variant="contained"
              color="primary"
              onClick={this.handleSubmit.bind(this)}
            >
              <i className="fas fa-address-book" style={iconRight}></i>
              знайти
              </Button>


          </div>

        </form>



        




      </div>
    )
  }

  handleNameChange = (e) => {
    let nameVal = e.target.value
    let name = { ...this.state.name }
    name.value = nameVal
    this.setState({ name })
  }

  handleDocNumberChange = (e) => {
    let docNumberVal = e.target.value
    let docNumber = { ...this.state.docNumber }
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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function isTitle(str) {
  return str === toTitleCase(str)
}

function hasSpaces(str) {
  return /\s/g.test(str);
}