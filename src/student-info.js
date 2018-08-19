import React from 'react';
import Button from '@material-ui/core/Button';
import './css/studentInfo.css'

export default class StudentInfo extends React.Component {
  state = {
    disabled: false
  }

  handleSubmit(student) {
    console.log('success')

    this.props.onSubmit(student)
    this.setState({
      disabled: true
    })
  }

  render() {
    const {name, degree, year, activeStudent, formOfStudy, specialty} = this.props.data
    const student = this.props.data
    let disabled = this.state.disabled
    let classes = ['student']
    if (disabled) classes.push('disabled')

    return (
        <div className={classes.join(' ')}>

          <div className="data">
            <div className="student--name">{name}</div>
            <div className="student--info">
              <div className="student--specialty">{specialty}</div>
              <div className="student--year">{degree} – {year} курс</div>
              <div className="student--form">{formOfStudy}</div>
            </div>
          </div>

          <div className="actions">
            {!activeStudent &&
              <Button disabled={disabled} variant="flat" color="primary" onClick={() => {this.handleSubmit(student)}}>обрати</Button>
            }
          </div>

        </div>
      )
  }

}
