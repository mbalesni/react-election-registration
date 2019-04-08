import React from 'react';
import Button from '@material-ui/core/Button'
import Input from '@material-ui/core/Input';
import './student-search.css'
// import { message } from 'antd'
import { ICONS } from '../../utils/icons.js'
import { showNotification } from '../../utils/functions'


const MIN_LENGTH = {
  name: 5,
  docNumber: 3
}

export default class StudentSearch extends React.Component {
  state = {
    docType: '0',
    isScanning: false,
    value: '0',
    name: {
      value: '',
      label: `ім'я`,
      name: 'name'
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
    let { name } = this.state

    let query = name.value

    this.props.onSearchByName(query)

  }

  validate(name) {
    let parsedName = name
        .trim()                   // remove leading and trailing whitespaces
        .replace(/\s+/gm, ' ')    // remove double/triple/etc consecutive whitespaces

    // true condition means error
    // string is error explanation
    return {
      name: (parsedName.length < MIN_LENGTH.name) ? `Введіть не менше ${MIN_LENGTH.name} символів` : '',
    }
  }

  handleBlur = (field) => (evt) => {
    this.setState({
      touched: { ...this.state.touched, [field]: true },
    })
  }

  handleSubmit(e) {
    const { name } = this.state
    const errors = this.validate(name.value)

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
        text += `Введіть не менше ${MIN_LENGTH[field.name]} символів.`

        // message.warn(text)
        showNotification({
          message: text,
          icon: ICONS.errorIcon,
          iconColor: 'orange',
          position: 'topRight',
          progressBar: false,
          animateInside: false,
          transitionIn: 'bounceInLeft',
          backgroundColor: '#444',
          messageColor: 'rgba(255,255,255,.9)',
          timeout: 5 * 1000
        })
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
    const { name } = this.state

    const errors = this.validate(name.value)

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

            <Button
              color="primary"
              className="search-btn"
              disabled={this.props.loading}
              onClick={this.handleSubmit.bind(this)}
              variant="contained"
            >
              <i className={ICONS.searchingIcon} style={iconRight}></i>
              Знайти студента
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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
