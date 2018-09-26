import React from 'react';
import { ICONS } from './icons.js'
import Button from '@material-ui/core/Button'
import StudentFinder from './student-finder.js'
import StudentInfo from './student-info.js'
import SessionStatus from './session-status.js'

import './css/checkIn.css'

const Fragment = React.Fragment

export default class CheckIn extends React.Component {
  getStudentsInfo() {
    let foundStudents = this.props.foundStudents.map(student => (
      <StudentInfo
        key={this.props.foundStudents.indexOf(student)}
        onSubmit={this.props.onStudentSubmit}
        data={student}
        activeStudent={this.props.activeStudent}
      />))

    return foundStudents
  }

  render() {
    const foundStudents = this.getStudentsInfo()

    return (
      <div className="check-in card card-default">

        <div className="card-header">

          <div className="card-title">
            <i className={ICONS.userCheck}></i>
            Реєстрація виборця
          </div>

          <Button onClick={this.props.onCancelSession} color="secondary">скасувати</Button>

        </div>

        <div className="card-block">

          {this.props.foundStudents.length < 1 &&
            <StudentFinder
              onScanStart={this.props.onScanStart.bind(this)}
              onScanCancel={this.props.onScanCancel}
              onSearchByName={this.props.onSearchByName}
              activeStudent={this.props.activeStudent}
            />
          }

          <div className="card-content">
            {this.props.foundStudents.length > 0 && !this.props.activeStudent &&
              <Fragment>
                <p className="found-students-num">
                  Знайдено {foundStudents.length} студент{foundStudents.length > 1 ? 'ів' : 'а'}
                </p>
                <div className="found-students">{foundStudents}</div>
              </Fragment>
            }

            {this.props.activeStudent &&
              <StudentInfo data={this.props.activeStudent} activeStudent={this.props.activeStudent} />
            }

            <div className="check-in-controls">
              {this.props.activeStudent &&
                <Button onClick={this.props.onCompleteSession} variant="contained" color="primary">видано</Button>
              }
            </div>
          </div>

        </div>

      </div>
    )
  }

}
