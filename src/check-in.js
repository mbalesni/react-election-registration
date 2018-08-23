import React from 'react';
import {ICONS} from './icons.js'
import Button from '@material-ui/core/Button'
import StudentFinder from './student-finder.js'
import StudentInfo from './student-info.js'
import SessionStatus from './session-status.js'

import './css/checkIn.css'

export default class CheckIn extends React.Component {
  getStudentsInfo () {
    let foundStudents = this.props.foundStudents.map(student => <StudentInfo key={this.props.foundStudents.indexOf(student)} onSubmit={this.props.onStudentSubmit} data={student} activeStudent={this.props.activeStudent} />)

    return (foundStudents)
  }

  render() {
    return (
      <div className="check-in card card-default">

        <div className="card-header">

          <div className="card-title">
            <i className={ICONS.userCheck}></i>
            Реєстрація виборця
          </div>

          <Button onClick={this.props.onCancelSession} color="secondary">скасувати</Button>

        </div>

        <SessionStatus
          type={this.props.status.type}
          message={this.props.status.message}
        />

        <div className="card-block">

          {this.props.foundStudents.length < 1  &&
            <StudentFinder
              onScanStart={this.props.onScanStart.bind(this)}
              onScanCancel={this.props.onScanCancel}
              onSearchByName={this.props.onSearchByName}
              activeStudent={this.props.activeStudent}
            />
          }

          {this.props.foundStudents.length > 0 &&
            <div className="found-students">
              {this.getStudentsInfo()}
            </div>
          }

          <div className="check-in-controls">
            {this.props.activeStudent &&
              <Button onClick={this.props.onCompleteSession} variant="contained" color="primary">видано</Button>
            }
          </div>

        </div>

      </div>
    )
  }

}
