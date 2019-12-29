import React from 'react';
import Button from '@material-ui/core/Button'
import Input from '@material-ui/core/Input';
import './index.css'
import { ICONS } from '../../utils/icons.js'
import { showNotification } from '../../utils/functions'
import connect from 'storeon/react/connect'


const MIN_LENGTH = {
  name: 4,
}

class StudentSearch extends React.Component {
  state = {
    value: '0',
    name: {
      value: '',
      label: `name`,
      name: 'name'
    },
    touched: {
      name: false,
    },
  }

  handleChange = event => {
    this.setState({ value: event.target.value })
  }

  search() {
    let { name } = this.state

    let query = name.value

    this.props.dispatch('session/searchByName', query)

  }

  validate(name) {
    let parsedName = name
        .trim()                   // remove leading and trailing whitespaces
        .replace(/\s+/gm, ' ')    // remove double/triple/etc consecutive whitespaces

    // true condition means error
    // string is error explanation
    return {
      name: (parsedName.length < MIN_LENGTH.name) ? `Use at least ${MIN_LENGTH.name} characters` : '',
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
        text += `Use at least ${MIN_LENGTH[field.name]} characters.`

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
    const { appGlobal } = this.props
    const { loading, isOnline } = appGlobal
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
      <div className="student-finder">

        <form >
          <div className="student-by-name-finder">

            <Input
              className="input student-name"
              error={shouldMarkError('name')}
              placeholder="Full name"
              value={this.state.name.value}
              fullWidth={true}
              onChange={this.handleNameChange}
              onBlur={this.handleBlur('name')}
              tabIndex="1"
              onKeyPress={this.handleSubmitOnEnter.bind(this)}
              autoFocus
            />

            <Button
              color="primary"
              className="search-btn"
              disabled={loading || !isOnline}
              onClick={this.handleSubmit.bind(this)}
              variant="text"
            >
              <i className={ICONS.searchingIcon} style={iconRight}></i>
              Find voter
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

}

export default connect('appGlobal', StudentSearch)