import React from 'react'

import axios from 'axios'
import Raven from 'react-raven'
import { MuiThemeProvider } from '@material-ui/core/styles';
import Quagga from 'quagga'
import { QUAGGA_OPTIONS } from './plugins/quagga-options.js'
import CheckIn from './check-in.js'
import OpenNewSession from './open-new-session.js'
import Header from './header.js'
import Footer from './footer.js'
import { THEME } from './theme.js'
import { BarLoader } from 'react-spinners';
import { css } from 'react-emotion';
import * as errors from './errors.json';

console.log(errors)

const spinnerStyles = css`
  position: absolute !important;
`

// BASE URLs
//
// Local                'http://localhost:8000'
// Heroku DEV           'https://elists-dev.herokuapp.com'
// Heroku PROD          'https://elists.herokuapp.com'

const BASE_URL = 'http://localhost:8000'
const BASE_API_URL = BASE_URL + '/api/elists'


function AppleNotSupported(props) {
  return (
    <div className="apple-not-supported">
      {errors.user.apple_not_supported}
    </div>
  )
}

export default class extends React.Component {
  state = {
    sessionIsOpen: false,
    status: {},
    foundStudents: [],
    auth: { loggedIn: false, user: '' },
    loading: true
  }

  render() {
    let { loggedIn } = this.state.auth
    const isAppleMobileDevice = checkAppleMobileDevice()

    return (
      <div className="page-content-wrapper ">

        <Raven dsn='https://6114eea799a146298b71db08a24d036d@sentry.io/1241630' />

        <MuiThemeProvider theme={THEME}>
          <div className="header-and-content">
            <Header auth={this.state.auth} baseUrl={BASE_URL} />
            <BarLoader
              color="rgba(33, 150, 243, 0.8)"
              className={spinnerStyles}
              loading={this.state.loading}
              width={100}
              widthUnit={"%"}
              height={3}
            />

            {isAppleMobileDevice && <AppleNotSupported />}

            <div className="content">
              {loggedIn && !this.state.sessionIsOpen && !isAppleMobileDevice &&
                <OpenNewSession onSessionOpen={this.openSession.bind(this)} />
              }

              {loggedIn && this.state.sessionIsOpen &&
                <CheckIn
                  activeStudent={this.state.activeStudent}
                  status={this.state.status}
                  foundStudents={this.state.foundStudents}
                  onStudentSubmit={this.submitStudent.bind(this)}
                  onScanStart={this.initScan.bind(this)}
                  onScanCancel={this.cancelScan.bind(this)}
                  onCancelSession={this.cancelSession.bind(this)}
                  onCompleteSession={this.completeSession.bind(this)}
                  onSearchByName={this.searchStudentByName.bind(this)}
                />}

            </div>
          </div>
          <Footer />
        </MuiThemeProvider>
      </div>
    )
  }

  componentDidMount() {
    axios.defaults.baseURL = BASE_API_URL
    axios.defaults.withCredentials = true
    this.getAuth()
    this.closeSessions()
  }

  getAuth() {
    axios.defaults.withCredentials = true

    axios.post('/me', {})
      .then(res => {
        this.setState({
          auth: {
            loggedIn: true,
            user: `${res.data.data.staff.first_name} ${res.data.data.staff.last_name}`
          },
          loading: false
        })
      })
      .catch(err => {
        this.setState({
          auth: {
            loggedIn: false
          }
        })
        window.location.href = `${BASE_URL}/admin/login?next=/elists/front`

      })

  }

  closeSessions() {
    axios.post('/close_sessions', {})
      .catch(err => {
        this.handleError(err)
      })
  }

  openSession() {
    this.setState({ loading: true })
    axios.post('/start_new_session', {})
      .then(res => {
        this.setState({
          sessionIsOpen: true,
          checkInSessionToken: res.data.data.check_in_session.token,
          status: {
            type: 'info',
            message: 'Оберіть тип документа'
          },
          loading: false
        })
      })
      .catch(err => {
        this.handleError(err)
      })
  }

  searchStudentByTicketNumber(ticketNum) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.student = { ticket_number: ticketNum }

    this.setState({ loading: true })

    axios.post('/search_by_ticket_number', data)
      .then(res => {
        const studentObj = res.data.data.student

        let student = this.buildStudentData(studentObj)

        let foundStudents = this.state.foundStudents.slice()
        foundStudents[0] = { ...foundStudents[0], ...student }

        this.setState({
          docType: 0,
          docNumber: ticketNum,
          foundStudents: foundStudents,
          status: {
            type: 'info',
            message: 'Підтвердіть правильність даних та оберіть студента'
          },
          loading: false
        })
      })
      .catch(err => {
        this.handleError(err)
      })
  }

  searchStudentByName(name, docType, docNum) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.student = {}
    data.student.full_name = name

    console.log('Searching student by name ', name, ', saving document type ', docType, ' , number: ', docNum)

    this.setState({ loading: true })

    axios.post('/search_by_name', data)
      .then(res => {
        console.log(res)
        const students = res.data.data.students

        let foundStudents = students.map(student => {
          return this.buildStudentData(student)
        })

        this.setState({
          docType: docType,
          docNum: docNum,
          foundStudents: foundStudents,
          status: {
            type: 'info',
            message: 'Підтвердіть правильність даних та оберіть студента'
          },
          loading: false
        })

      })
      .catch(err => {
        this.handleError(err)
      })
  }

  buildStudentData(student) {
    let data = {
      name: student.data.full_name,
      degree: student.data.educational_degree === 1 ? 'Бакалавр' : 'Магістр',
      formOfStudy: student.data.form_of_study === 1 ? 'Денна' : 'Заочна',
      structuralUnit: student.data.structural_unit,
      specialty: student.data.specialty,
      year: student.data.year,
      token: student.token
    }
    return data
  }

  submitStudent(student) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.student = {}
    data.student.token = student.token
    data.student.doc_type = this.state.docType
    data.student.doc_num = this.state.docNum

    console.log('Trying to submit student: ', data)

    this.setState({ loading: true })

    axios.post('/submit_student', data)
      .then(res => {
        this.setState({
          activeStudent: student,
          status: {
            type: 'info',
            message: 'Видайте бюлетень'
          },
          loading: false
        })
      })
      .catch(err => {
        this.handleError(err)
      })
  }

  handleError(err, code) {
    let errData = err
    if (err.response) {
      console.error("Error: ", err.response)
      if (err.response.status !== 400) code = 300
      else code = err.response.data.error.code
      errData = err.response.data.error
    }
    console.error('Error data: ', errData)
    console.log('Error code: ', code)

    this.setState({
      error: errData,
      status: {
        type: 'error',
        message: errors[code]
      },
      loading: false

    })
  }

  cancelSession() {
    let data = { check_in_session_token: this.state.checkInSessionToken }

    this.setState({ loading: true })
    axios.post('/cancel_session', data)
      .then(res => {
        this.onSessionEnd()
      })
      .catch(err => {
        this.handleError(err)
      })
  }

  completeSession() {
    let data = { check_in_session_token: this.state.checkInSessionToken }

    this.setState({ loading: true })
    axios.post('/complete_session', data)
      .then(res => {
        this.onSessionEnd()
      })
      .catch(err => {
        this.handleError(err)
      })
  }

  onSessionEnd() {
    this.setState({
      activeStudent: null,
      sessionIsOpen: false,
      checkInSessionToken: null,
      foundStudents: [],
      loading: false
    })
    Quagga.stop()
  }

  initScan() {
    this.setState({ loading: true })
    Quagga.init(
      { ...QUAGGA_OPTIONS, inputStream: { ...QUAGGA_OPTIONS.inputStream, target: document.querySelector('.scanner-container') } },
      (err) => {
        if (err) {
          this.handleError(err, 506)
          return
        }
        Quagga.start()
        this.setState({
          status: {
            type: 'info',
            message: 'Піднесіть студентський квиток до камери'
          },
          loading: false
        })
        this.initOnDetected()
      })
  }

  cancelScan() {
    Quagga.stop();
    this.setState({
      sessionsStatus: 100,
      status: {
        type: 'info',
        message: 'Оберіть тип документа'
      }
    })
  }

  initOnDetected() {
    Quagga.onDetected((data) => {
      const result = data.codeResult.code
      if (result.length === 8) {
        // playSuccessSound()
        Quagga.stop()
        this.searchStudentByTicketNumber(result)
      } else {
        this.handleError('Error', 507)
      }
    })
  }

}

function checkAppleMobileDevice() {
  if (window.navigator.userAgent.includes('iPad') || window.navigator.userAgent.includes('iPhone')) return true
  else return false
}