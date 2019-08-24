import React, { Fragment } from 'react';
import { ICONS } from '../../utils/icons.js'
import Button from '@material-ui/core/Button'
import StudentSearch from '../student-search'
import StudentOption from '../student-option'
import DocInput from '../doc-input';
import FormHelperText from '@material-ui/core/FormHelperText';
import connect from 'storeon/react/connect'
import './index.css'

const iconStyle = {
  fontSize: '16px',
}

class Session extends React.Component {
  buildStudentOptionArr(students) {
    return students.map(student => (
      <StudentOption
        key={students.indexOf(student)}
        data={student}
      />))
  }

  handleGoBack() {

    if (!this.props.session.activeStudent.name) {
      this.props.dispatch('session/backToSearch')
    } else {
      this.props.dispatch('session/unselectStudent')
    }
  }

  cancelSession = () => {
    this.props.dispatch('session/cancel')
  }

  render() {
    const { appGlobal, session } = this.props
    const { loading } = appGlobal
    const { helpText, students } = session

    const studentOptions = this.buildStudentOptionArr(students)

    return (
      <div className="card-enlarger" >

        <div className="card-header">

          <div className="card-title">
            <i className={ICONS.userCheck} style={iconStyle}></i>
            Реєстрація
            </div>

          <div className="session-controls">
            {students.length > 0 &&
              <Button onClick={this.handleGoBack.bind(this)}>Назад</Button>
            }
            <Button disabled={loading} onClick={this.cancelSession} color="secondary">Скасувати</Button>
          </div>

        </div>

        <div className="card-block">

          {helpText &&
            <FormHelperText className="instructions-text">
              {helpText}
            </FormHelperText>
          }

          {students.length < 1 && <StudentSearch /> }

          {students.length > 0 &&
            !this.props.session.activeStudent.name &&
            <div className="found-students">{studentOptions}</div>
          }

          {this.props.session.activeStudent.name &&
            <Fragment>
              <div className="found-students">
                <StudentOption data={this.props.session.activeStudent} />
              </div>
              <DocInput
                activeStudent={this.props.session.activeStudent}
                loading={loading}
              />
            </Fragment>
          }

        </div>

      </div >
    )
  }

}

export default connect('appGlobal', 'session', Session)
