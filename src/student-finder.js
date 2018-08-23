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
    value: '0'
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
    let { studentName, value, docNum} = this.state
    this.props.onSearchByName(studentName, value, docNum)

  }


  render() {
    const { value } = this.state

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
                placeholder="Повне ім'я"
                fullWidth={true}
                onChange={this.handleNameChange}
              />

              <Input
                className="input doc-number"
                placeholder="Номер документа"
                value={this.state.docNumber}
                fullWidth={true}
                onChange={this.handleDocNumChange}
              />

              <Button
                className="search-btn"
                variant="contained"
                color="primary"
                onClick={this.handleSearch.bind(this)}
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
    let studentName = e.target.value
    this.setState({ studentName: studentName })
  }

  handleDocNumChange = (e) => {
    let docNum = e.target.value
    this.setState({ docNum })
  }


}
