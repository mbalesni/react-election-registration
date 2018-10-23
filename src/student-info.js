import React from 'react';
import Button from '@material-ui/core/Button';
import './css/studentInfo.css'

export default class StudentInfo extends React.Component {
  state = {
    disabled: false
  }

  handleSelect(student) {
    console.log(`Selecting student ${student.name} (Year: ${student.year}, Specialty: ${student.specialty})`)

    this.props.onSelect(student)
    this.setState({
      disabled: true,
    })
  }

  componentDidMount() {
    if (this.props.activeStudent) this.setState({ disabled: true })
    if (this.props.data.status !== 0) this.setState({ disabled: true })
  }

  render() {
    const { name, degree, year, activeStudent, formOfStudy, specialty, structuralUnit, status } = this.props.data
    const student = this.props.data
    let { disabled } = this.state
    let classes = ['student']
    if (disabled) classes.push('disabled')

    let buttonName = ''

    switch (status) {
      case 0:
        buttonName = 'зареєструвати'
        break
      case 1:
        buttonName = 'в процесі'
        break
      case 2:
        buttonName = 'вже зареєстровано'
        break
      default:
        buttonName = 'зареєструвати'
    }

    return (
        <div className={classes.join(' ')}>

          <div className="data">
            <div className="student--name">{name}</div>
            <div className="student--info">
              <div>{structuralUnit}</div>
              <div>{specialty}</div>
              <div>{year} курс | {degree} | {formOfStudy}</div>
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
