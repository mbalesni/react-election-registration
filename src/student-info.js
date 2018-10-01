import React from 'react';
import Button from '@material-ui/core/Button';
import './css/studentInfo.css'

export default class StudentInfo extends React.Component {
  state = {
    disabled: false,
    submitted: false
  }

  handleSubmit(student) {
    console.log('success')

    this.props.onSubmit(student)
    this.setState({
      disabled: true,
      submitted: true
    })
  }

  componentDidMount() {
    if (this.props.activeStudent) this.setState({ submitted: true, disabled: true })
    if (this.props.data.status !== 0) this.setState({ disabled: true })
  }

  render() {
    const { name, degree, year, activeStudent, formOfStudy, specialty, structuralUnit, status } = this.props.data
    const student = this.props.data
    let { disabled, submitted } = this.state
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
              <Button disabled={disabled} variant="flat" color="primary" onClick={() => { this.handleSubmit(student) }}>
                {buttonName}
              </Button>
            }
          </div>

        </div>
      )
  }

}
