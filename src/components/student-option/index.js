import React from 'react';
import Button from '@material-ui/core/Button';
import './index.css'

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
    if (this.props.activeStudent) this.setState({ disabled: true })
    if (this.props.data.hasVoted === true) this.setState({ disabled: true })
  }

  render() {
    const { activeStudent } = this.props
    const { name, hasVoted } = this.props.data
    const additionalInfo = this.props.data.data
    const student = this.props.data

    let classes = ['student']

    let { disabled } = this.state
    if (disabled) classes.push('disabled')

    let buttonName = ''

    switch (hasVoted) {
      case false:
        buttonName = 'Зареєструвати'
        break
      case true:
        buttonName = 'Зареєстровано'
        break
      default:
        buttonName = 'Зареєструвати'
    }

    let fieldNames = Object.keys(additionalInfo)
    let studentInfo = []
    fieldNames.map((field, i) => {
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
            <Button disabled={disabled} variant="contained" color="primary" onClick={() => { this.handleSelect(student) }}>
              {buttonName}
            </Button>
          }
        </div>

      </div>
    )
  }

}
