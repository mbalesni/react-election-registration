import React from 'react';
import Button from '@material-ui/core/Button';
import CONFIG from '../../config'
import './index.css'

const { PRINT_BALLOTS } = CONFIG

export default class StudentOption extends React.Component {
  state = {
    disabled: false
  }

  handleSelect(student) {
    console.log(`Selecting student...`)
    this.props.onSelect(student)
    this.setState({
      disabled: true,
    })
  }

  componentDidMount() {
    let disabled = false
    if (this.props.activeStudent) disabled = true
    if (this.props.data.hasVoted === true && !PRINT_BALLOTS) disabled = true
    this.setState({ disabled })
  }

  render() {
    const { activeStudent } = this.props
    const { name, hasVoted } = this.props.data
    const additionalInfo = this.props.data.data
    const student = this.props.data

    let classes = ['student']

    let { disabled } = this.state
    if (disabled) classes.push('disabled')

    const button = {
      name: '',
      color: '',
    }

    switch (hasVoted) {
      case false:
        button.name = 'Зареєструвати'
        button.color = 'primary'
        break
      case true:
        button.name = PRINT_BALLOTS ? 'Повторний бюлетень' : 'Зареєстровано'
        button.color = PRINT_BALLOTS ? 'secondary' : 'primary'
        break
      default:
        button.name = 'Зареєструвати'
        button.color = 'primary'
    }

    let fieldNames = Object.keys(additionalInfo)
    let studentInfo = []
    fieldNames.forEach((field, i) => {
      const value = additionalInfo[field]
      if (value) {
        const optionalBar = (i === 0) ? '' : ' | '
        studentInfo.push(<span key={field}>{optionalBar + value}</span>)
      }
    })

    return (
      <div className={classes.join(' ')}>
        <div className="data">
          <div className="student--name">{name}</div>
          <div className="student--info">
            {studentInfo}
          </div>
        </div>

        <div className="actions">
          {!activeStudent &&
            <Button disabled={disabled} variant="text" color={button.color} onClick={() => { this.handleSelect(student) }}>
              {button.name}
            </Button>
          }
        </div>

      </div>
    )
  }

}
