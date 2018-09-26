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

export default class StudentFinder extends React.Component {
  state = {
    docType: '0',
    isScanning: false,
    value: '0',
    name: '',
    docNumber: '',
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
    this.props.onSearchByName(name, value, docNumber)

  }

  validate(name, docNumber) {
    // message string means invalid
    return {
      name: name.length < 3 && 'Ім\'я повинно бути 3 або більше символів в довжину' || '',
      docNumber: docNumber.length < 3 && 'Номер документа повинен бути 3 або більше символів в довжину' || '',
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
      const errors = this.validate(name, docNumber)
      const noErrors = Object.keys(errors).some(x => errors[x].length === 0)

      if (noErrors) this.handleSearch()
    } else return
  }


  render() {
    const { value, name, docNumber } = this.state

    const errors = this.validate(name, docNumber)
    const isDisabled = Object.keys(errors).some(x => errors[x].length > 0)

    const shouldMarkError = (field) => {
      const hasError = errors[field].length > 0
      const shouldShow = this.state.touched[field]

      return hasError ? shouldShow : false
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
                value={this.state.name}
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
                value={this.state.docNumber}
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
    let name = e.target.value
    this.setState({ name })
  }

  handleDocNumberChange = (e) => {
    let docNumber = e.target.value
    this.setState({ docNumber })
  }


}
