import React, { Fragment } from 'react';
import { ICONS } from '../../utils/icons.js'
import Button from '@material-ui/core/Button'
import StudentSearch from '../student-search'
import StudentInfo from '../student-option'
import DocInput from '../doc-input';
import FormHelperText from '@material-ui/core/FormHelperText';
import './index.css'


export default class SessionWindow extends React.Component {
  getStudentsInfo() {
    let students = this.props.students.map(student => (
      <StudentInfo
        key={this.props.students.indexOf(student)}
        onSubmit={this.props.onStudentSubmit}
        onSelect={this.props.onStudentSelect}
        data={student}
        activeStudent={this.props.activeStudent}
      />))

    return students
  }

  handleGoBack() {

    if (!this.props.activeStudent) {
      this.props.onSearchBack()
    } else {
      this.props.onStudentUnselect()
    }
  }

  render() {
    const { status } = this.props

    const students = this.getStudentsInfo()

    return (
      <Fragment>
        <div className="check-in card card-default" >

          <div className="card-header">

            <div className="card-title">
              <i className={ICONS.userCheck}></i>
              Реєстрація
            </div>

            <div className="session-controls">
              {this.props.students.length > 0 &&
                <Button onClick={this.handleGoBack.bind(this)}>Назад</Button>
              }
              <Button disabled={this.props.loading} onClick={this.props.onCancelSession} color="secondary">Скасувати</Button>
            </div>

          </div>

          <div className="card-block">

            {status &&
              <FormHelperText className="instructions-text">
                {status}
              </FormHelperText>
            }

            {this.props.students.length < 1 &&
              <StudentSearch
                activeStudent={this.props.activeStudent}
                onScanStart={this.props.onScanStart.bind(this)}
                onScanCancel={this.props.onScanCancel}
                onSearchByName={this.props.onSearchByName}
                loading={this.props.loading}
              />
            }

            {this.props.students.length > 0 &&
              !this.props.activeStudent &&
              <div className="found-students">{students}</div>
            }

            {this.props.activeStudent &&
              <Fragment>
                <div className="found-students">
                  <StudentInfo data={this.props.activeStudent} activeStudent={this.props.activeStudent} />
                </div>
                <DocInput
                  activeStudent={this.props.activeStudent}
                  onScanStart={this.props.onScanStart.bind(this)}
                  onCancelSession={this.props.onCancelSession}
                  onScanCancel={this.props.onScanCancel.bind(this)}
                  onSubmit={this.props.onStudentSubmit}
                  onCompleteSession={this.props.onCompleteSession.bind(this)}
                  loading={this.props.loading}
                />
              </Fragment>
            }

          </div>

        </div >

      </Fragment>
    )
  }

}


