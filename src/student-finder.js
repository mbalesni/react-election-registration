import React from 'react';
import Button from '@material-ui/core/Button'
import Video from './video.js'
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import './css/studentFinder.css'

export default class StudentFinder extends React.Component {
  state = {
    docType: 'ticket',
    isScanning: false,
    student: {}
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleStartScan() {
    this.setState({isScanning: true})
    this.props.onScanStart()
  }

  handleCancelScan() {
    this.props.onScanCancel()
    this.setState({
      isScanning: false
    })
  }


  render() {
    return (
      <div className="student-finder">

        {this.state.isScanning === false && <form >
          <div className="row">
            <Select
              value={this.state.docType}
              onChange={this.handleChange('docType')}
              inputProps={{
                name: 'age',
                id: 'age-simple',
              }}
            >
              <MenuItem value="ticket">Студентський квиток</MenuItem>
              <MenuItem value="grade-book">Заліковка</MenuItem>
              <MenuItem value="certificate">Довідка</MenuItem>
            </Select>


          </div>

          <div className="row" style={{marginTop: 20}}>
            {this.state.docType === 'ticket' &&
            <Button onClick={this.handleStartScan.bind(this)} variant="contained" color="primary">почати сканування</Button>}

            {this.state.docType !== 'ticket' &&
              <TextField
              id="name"
              label="Повне ім'я"
              value={this.state.student.name}
              onChange={this.handleChange('name')}

            />}
          </div>
        </form>}



          {this.state.docType === 'ticket' &&
            <Video show={this.state.isScanning} onScanCancel={this.handleCancelScan.bind(this)}/>
          }


      </div>
    )
  }


}
