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
import { message } from 'antd'
import 'antd/dist/antd.css';
import * as errors from './errors.json';

const spinnerStyles = css`
  position: absolute !important;
`

const Fragment = React.Fragment

// retrieving environment variables

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || ''
const BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL || 'http://localhost:8000'
const BASE_API_URL = BASE_URL + '/elists/api'

const initialState = {
  activeStudent: null,
  auth: { loggedIn: false, user: '' },
  ballotNumber: null,
  docNumber: null,
  docType: null,
  sessionIsOpen: false,
  checkInSessionToken: null,
  foundStudents: [],
  loading: false
}

export default class extends React.Component {
  state = { ...initialState }

  render() {
    const { loggedIn } = this.state.auth
    const { ballotNumber, loading } = this.state

    return (
      <div className="page-content-wrapper " >

        <Raven dsn={SENTRY_DSN} />

        <MuiThemeProvider theme={THEME}>
          <div className="header-and-content">
            <Header auth={this.state.auth} baseUrl={BASE_URL} onCloseSessions={this.closeSessions.bind(this)} />
            <BarLoader
              color="rgba(33, 150, 243, 0.8)"
              className={spinnerStyles}
              loading={this.state.loading}
              width={100}
              widthUnit={"%"}
              height={3}
            />

            <div className="content">
              {loggedIn && !this.state.sessionIsOpen &&
                <OpenNewSession onSessionOpen={this.openSession.bind(this)} loading={loading} />
              }

              {loggedIn && this.state.sessionIsOpen &&
                <CheckIn
                  activeStudent={this.state.activeStudent}
                  ballotNumber={ballotNumber}
                  status={this.state.status}
                  foundStudents={this.state.foundStudents}
                  onSearchBack={this.searchGoBack.bind(this)}
                  onStudentSubmit={this.submitStudent.bind(this)}
                  onStudentSelect={this.selectStudent.bind(this)}
                  onScanStart={this.initScan.bind(this)}
                  onScanCancel={this.cancelScan.bind(this)}
                  onCancelSession={this.cancelSession.bind(this)}
                  onCompleteSession={this.completeSession.bind(this)}
                  onSearchByName={this.searchStudentByName.bind(this)}
                  onStudentUnselect={this.unselectStudent.bind(this)}
                  loading={loading}
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
    message.config({
      maxCount: 1,
      duration: 5
    })
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
    axios.post('/close_sessions')
      .catch(err => {
        console.warn(err)
      })
  }

  openSession() {
    this.setState({ loading: true })
    axios.post('/start_new_session', {})
      .then(res => {
        const checkInSessionToken = res.data.data.check_in_session.token

        this.setState({
          sessionIsOpen: true,
          checkInSessionToken,
          status: {
            type: 'info',
            message: 'Знайдіть студента в базі'
          },
          loading: false
        })
      })
      .catch(err => {
        this.handleError(err)
      })
  }

  // searchStudentByTicketNumber(ticketNum) {

  //   let data = {}
  //   data.check_in_session_token = this.state.checkInSessionToken
  //   data.student = { ticket_number: ticketNum }

  //   this.setState({ loading: true })

  //   axios.post('/search_by_ticket_number', data)
  //     .then(res => {
  //       const studentObj = res.data.data.student

  //       let student = this.buildStudentData(studentObj)

  //       let foundStudents = this.state.foundStudents.slice()
  //       foundStudents[0] = { ...foundStudents[0], ...student }

  //       this.setState({
  //         docType: 0,
  //         docNumber: ticketNum,
  //         foundStudents: foundStudents,
  //         status: {
  //           type: 'info',
  //           message: this.getFoundStudentsNote(foundStudents),
  //         },
  //         loading: false
  //       })
  //     })
  //     .catch(err => {
  //       this.handleError(err)
  //     })
  // }

  getFoundStudentsNote(foundStudents, query) {
    const len = foundStudents.length
    return (
      <Fragment>
        <div>{len > 1 ? 'Оберіть' : 'Перевірте дані та зареєструйте'} студента</div>
        <div className="found-students-num">
          За запитом <strong>{query}</strong> знайдено {len} студент{len > 1 ? 'ів' : 'а'}
        </div>
      </Fragment>
    )
  }

  searchStudentByName(name) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.student = {}
    data.student.full_name = name

    console.log('Searching student by name ', name)

    this.setState({ loading: true })

    axios.post('/search_by_name', data)
      .then(res => {
        console.log(res)
        const students = res.data.data.students

        let foundStudents = students.map(student => {
          return this.buildStudentData(student)
        })

        this.setState({
          foundStudents,
          status: {
            type: 'info',
            message: this.getFoundStudentsNote(foundStudents, name),
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
      token: student.token,
      status: student.status.code
    }
    return data
  }

  selectStudent(student) {
    this.setState({
      activeStudent: student,
      status: {
        type: 'info',
        message: 'Введіть номер підтверджуючого документа'
      }
    })
  }

  submitStudent(student) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.student = {}
    data.student.token = student.token
    data.student.doc_type = student.docType
    data.student.doc_num = student.docNumber

    this.setState({ loading: true })

    axios.post('/submit_student', data)
      .then(res => {
        let ballotNumber = res.data.data.ballot_number

        this.setState({
          activeStudent: student,
          status: {
            type: 'info',
            message: 'Заповніть та видайте бюлетень'
          },
          loading: false,
          ballotNumber
        })
      })
      .catch(err => {
        this.handleError(err)
      })
  }

  searchGoBack() {
    this.setState({
      foundStudents: [],
      status: {
        type: 'info',
        message: "Знайдіть студента в базі"
      }
    })
    this.searchStudentByTicketNumberStarted = false
  }

  unselectStudent() {
    this.setState({
      activeStudent: null,
    })
  }

  handleError(err, code) {
    let errData = err
    // console.log(err.message)

    if (err.response) {
      console.warn("Error response: ", err.response)
      switch (err.response.status) {
        case 400:
          if (err.response.data && err.response.data.error) {
            code = err.response.data.error.code
            errData = err.response.data.error.message
          } else {
            code = 300
            errData = err.response
          }
          break
        case 403:
          this.setState({ loading: false })
          message.warn('Відмовлено в доступі.')
          return
        default:
          code = 300
          errData = err.message
      }

    } else {
      code = 300
      errData = err.message
    }

    console.warn('Error data: ', errData)
    console.warn('Error code: ', code)

    this.setState({ loading: false })
    message.error(<span>{errors[code]} <span style={{ opacity: '.7' }}>Код помилки {code}</span></span>)

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
    const data = { check_in_session_token: this.state.checkInSessionToken }
    const studentName = this.state.activeStudent.name


    this.setState({ loading: true })
    axios.post('/complete_session', data)
      .then(res => {
        this.onSessionEnd()
        message.success(<span><strong>{studentName}</strong> – успішно зареєстровано.</span>, 3)
      })
      .catch(err => {
        this.handleError(err)
      })
  }

  onSessionEnd() {
    message.destroy()
    this.studentSubmitted = false
    this.setState(initialState)
    this.getAuth()
    try {
      Quagga.stop()
    } catch (err) {
      console.log('Quagga stop error: ', err)
    }
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
          loading: false
        })
        message.info('Піднесіть студентський квиток до камери')
        this.initOnDetected()
      })
  }

  cancelScan() {
    Quagga.stop();
    this.setState({
      status: {
        type: 'info',
        message: 'Введіть номер підтверджуючого документа'
      }
    })
    message.destroy()
  }

  initOnDetected() {
    Quagga.onDetected((data) => {
      const result = data.codeResult.code
      if (result.length === 8) {
        // prevent multi-requests
        if (this.studentSubmitted) return

        this.studentSubmitted = true
        message.destroy()
        Quagga.stop()       

        let activeStudent = this.state.activeStudent
        activeStudent.docNumber = result
        activeStudent.docType = '0'
        this.setState({ activeStudent })
        this.submitStudent(activeStudent)
        message.success('Студентський квиток відскановано.')

      } else {
        this.handleError('Error', 507)
      }
    })
  }

}