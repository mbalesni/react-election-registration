import React from 'react';
import { ICONS } from './icons.js'
import Button from '@material-ui/core/Button'
import StudentFinder from './student-finder.js'
import StudentInfo from './student-info.js'
import SessionStatus from './session-status.js'
import Ballot from './ballot.js'
import { Alert } from 'antd'

import './css/checkIn.css'
import { StudentDocInput } from './student-doc-input.js';

const Fragment = React.Fragment

export default class CheckIn extends React.Component {
  getStudentsInfo() {
    let foundStudents = this.props.foundStudents.map(student => (
      <StudentInfo
        key={this.props.foundStudents.indexOf(student)}
        onSubmit={this.props.onStudentSubmit}
        onSelect={this.props.onStudentSelect}
        data={student}
        activeStudent={this.props.activeStudent}
      />))

    return foundStudents
  }

  handleGoBack() {

    if (!this.props.activeStudent) {
      this.props.onSearchBack()
    } else {
      this.props.onStudentUnselect()
    }
  }

  render() {
    const { ballotNumber, status } = this.props

    const foundStudents = this.getStudentsInfo()

    return (
      <Fragment>


        <div className="check-in card card-default" >

          <div className="card-header">

            <div className="card-title">
              <i className={ICONS.userCheck}></i>
              Реєстрація виборця
            </div>

            <div className="session-controls">
              {this.props.foundStudents.length > 0 &&
                <Button onClick={this.handleGoBack.bind(this)} variant="flat" color="primary">назад</Button>
              }
              <Button disabled={this.props.loading} onClick={this.props.onCancelSession} color="secondary">скасувати</Button>
            </div>



          </div>

          <div className="card-block">

            {(status.show === true || status.show === undefined) && <Alert type={status.type} message={status.message} showIcon style={{ marginBottom: '1rem' }} />}

            {this.props.foundStudents.length < 1 &&
              <StudentFinder
                activeStudent={this.props.activeStudent}
                onScanStart={this.props.onScanStart.bind(this)}
                onScanCancel={this.props.onScanCancel}
                onSearchByName={this.props.onSearchByName}
                loading={this.props.loading}
              />
            }

            {this.props.foundStudents.length > 0 && !this.props.activeStudent &&
              <div className="found-students">{foundStudents}</div>
            }

            {this.props.activeStudent &&
              <Fragment>
                <StudentInfo data={this.props.activeStudent} activeStudent={this.props.activeStudent} />
                <StudentDocInput
                  activeStudent={this.props.activeStudent}
                  onScanStart={this.props.onScanStart.bind(this)}
                  onCancelSession={this.props.onCancelSession}
                  onScanCancel={this.props.onScanCancel.bind(this)}
                  onSubmit={this.props.onStudentSubmit}
                  loading={this.props.loading}
                />
              </Fragment>
            }


          </div>

        </div >

        {this.props.activeStudent && ballotNumber &&
          <Ballot
            number={ballotNumber}
            onComplete={this.props.onCompleteSession}
            onCancel={this.props.onCancelSession}
            loading={this.props.loading}
            status={status}
          />
        }
      </Fragment>
    )
  }

}
