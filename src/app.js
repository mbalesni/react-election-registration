import React from 'react'
import axios from 'axios'
import Raven from 'raven-js'
import Quagga from 'quagga'
import { MuiThemeProvider } from '@material-ui/core/styles';
import { QUAGGA_OPTIONS } from './plugins/quagga-options.js'
import SessionWindow from './components/session-window'
import NewSessionWindow from './components/new-session-window'
import ConsentDialog from './components/consent-window'
import RegistrationCompleteWindow from './components/registration-complete-window'
import Header from './components/header'
import Footer from './components/footer'
import { THEME } from './utils/theme.js'
import { BarLoader } from 'react-spinners';
import { css } from 'react-emotion';
import { ICONS } from './utils/icons.js'
import '../node_modules/izitoast/dist/css/iziToast.min.css'
import './utils/override-izitoast.css'
import ERRORS from './utils/errors.json';
import LoginWindow from './components/login-window';
import { showNotification } from './utils/functions.js';
import SessionComplete from './components/session-complete-window';
import CONFIG from './config.js'

const { BACKEND_BASE_URL } = CONFIG

axios.defaults.baseURL = BACKEND_BASE_URL
axios.defaults.withCredentials = true
axios.defaults.timeout = 5 * 1000
axios.interceptors.response.use(function (response) {
  if (response.data.auth_token) {
    axios.defaults.headers = {
      'X-Auth-Token': response.data.auth_token
    }
    localStorage.setItem('authToken', response.data.auth_token)
  }
  return response
}, function (error) {
  return Promise.reject(error)
});

const initialState = {
  activeStudent: null,
  activeStudentName: '',
  auth: { loggedIn: false, user: '' },
  ballotNumber: null,
  ballotPrinted: false,
  docNumber: null,
  docType: null,
  sessionIsOpen: false,
  checkInSessionToken: null,
  students: [],
  loading: false,
  showRegistrationComplete: '',
  printerError: null,
  showConsentDialog: false,
  consentGiven: false,
  searchQuery: '',
  showCompleteSession: false,
  studentSubmitted: '',
}

export default class App extends React.Component {
  state = { ...initialState }

  componentWillMount() {
    let storedAuthToken = localStorage.getItem('authToken')
    if (storedAuthToken) {
      this.setState({
        auth: {
          loggedIn: true
        }
      })

      this.onSuccessfulLogin(storedAuthToken)
    }
  }

  componentDidCatch(err, errInfo) {
    Raven.captureException(
      err,
      {
        extra: errInfo,
        user: {
          name: this.state.auth.user
        }
      }
    )
  }

  render() {
    const { loggedIn } = this.state.auth
    const { loading, showRegistrationComplete, ballotNumber, showConsentDialog, showCompleteSession } = this.state

    const spinnerStyles = css`
      position: absolute !important;
      top: 0;
    `

    return (
      <div className="page-content-wrapper " >

        <MuiThemeProvider theme={THEME}>
          <div className="header-and-content">
            <Header
              auth={this.state.auth}
              onCloseSessions={this.closeSessions.bind(this)}
              onLogout={this.logout}
            />
            <BarLoader
              color="rgba(33, 150, 243, 0.8)"
              className={spinnerStyles}
              loading={this.state.loading}
              width={100}
              widthUnit={"%"}
              height={3}
            />

            <div className="content">
              {!loggedIn &&
                <LoginWindow
                  onSuccess={this.onSuccessfulLogin}
                  handleApiError={this.handleApiError.bind(this)}
                  handleErrorCode={this.handleErrorCode.bind(this)}
                />
              }
              {loggedIn && !this.state.sessionIsOpen &&
                <NewSessionWindow
                  onSessionStart={this.startSession.bind(this)}
                  loading={loading}
                  startTimestamp={this.state.auth.voteStartTimestamp}
                  endTimestamp={this.state.auth.voteStartTimestamp}
                />
              }

              {loggedIn && this.state.sessionIsOpen &&
                <SessionWindow
                  activeStudent={this.state.activeStudent}
                  scannerSeed={this.state.scannerSeed}
                  status={this.state.status}
                  students={this.state.students}
                  onSearchBack={this.searchGoBack.bind(this)}
                  onStudentSubmit={this.registerStudent.bind(this)}
                  onStudentSelect={this.selectStudent.bind(this)}
                  onScanStart={this.initScan.bind(this)}
                  onScanCancel={this.cancelScan.bind(this)}
                  onCancelSession={this.cancelSession.bind(this)}
                  onCompleteSession={this.completeSession.bind(this)}
                  onSearchByName={this.searchStudentByName.bind(this)}
                  onStudentUnselect={this.unselectStudent.bind(this)}
                  voteOptions={this.state.voteOptions}
                  loading={loading}
                />}

              {showRegistrationComplete &&
                <RegistrationCompleteWindow
                  number={ballotNumber}
                  onComplete={this.completeSession.bind(this)}
                  onCancel={this.cancelSession.bind(this)}
                />
              }

              {showConsentDialog &&
                <ConsentDialog
                  staffName={this.state.auth.user}
                  onComplete={this.confirmConsent.bind(this)}
                  onCancel={this.cancelConsent.bind(this)}
                />
              }

              <SessionComplete
                open={showCompleteSession}
                studentName={this.state.studentSubmitted}
                onSessionEnd={this.onSessionEnd.bind(this)}
              />
            </div>
          </div>
          <Footer />
        </MuiThemeProvider>
      </div>
    )
  }

  getAuth() {
    this.setState({ loading: true })
    console.log('getting auth')

    return axios.post('/me', {})
      .then(res => {
        if (res.data.error) return this.handleErrorCode(res.data.error.code)
        this.setState({
          auth: {
            loggedIn: true,
            user: `${res.data.data.staff.first_name} ${res.data.data.staff.last_name}`,
            structuralUnit: res.data.data.staff.structural_unit_name,
            voteStartTimestamp: res.data.data.staff.vote_start_timestamp,
            voteEndTimestamp: res.data.data.staff.vote_end_timestamp,
          }
        })
      })
      .catch(err => {
        this.handleApiError(err)
        this.setState({
          auth: {
            loggedIn: false
          }
        })
      })
      .finally(() => {
        this.setState({ loading: false })
      })

  }

  pulse = () => {
    console.log('pulse')

    axios.post('/me', {})
      .then(res => {
        if (res.data.error) this.handleErrorCode(res.data.error.code)
      })
      .catch(err => {
        this.handleApiError(err)
      })
  }

  onSuccessfulLogin = (authToken) => {
    axios.defaults.headers = {
      'X-Auth-Token': authToken
    }
    localStorage.setItem('authToken', authToken)

    this.getAuth()
      .then(this.closeSessions)

    this.pulse = setInterval(this.pulse, CONFIG.PULSE_INTERVAL * 1000)
  }

  closeSessions() {
    axios.post('/close_sessions', {})
      .catch(err => {
        console.warn(err)
      })
  }

  startSession() {
    console.log('Starting new session...')
    this.setState({ loading: true })
    axios.post('/start_new_session', {})
      .then(res => {
        if (res.data.error) return this.handleErrorCode(res.data.error.code)
        const checkInSessionToken = res.data.data.check_in_session.token
        this.setState({
          sessionIsOpen: true,
          checkInSessionToken,
          status: 'Знайдіть студента в базі',
        })
      })
      .catch(err => {
        this.handleApiError(err)
      })
      .finally(() => {
        this.setState({ loading: false })
      })
  }

  buildFoundStudentsNote(numOfStudents, query) {
    return (
      <>
        {numOfStudents > 1 ? 'Оберіть' : 'Перевірте дані та зареєструйте'} студента
        <br />
        За запитом <strong>{query}</strong> знайдено {numOfStudents} студент{numOfStudents > 1 ? 'ів' : 'а'}
      </>
    )
  }

  searchStudentByName(name) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.student = {}
    data.student.full_name = name

    console.log('Searching student by name...')

    this.setState({ loading: true, searchQuery: name })

    axios.post('/search_by_name', data)
      .then(res => {
        if (res.data.error) return this.handleErrorCode(res.data.error.code)

        const foundStudents = res.data.data.students
        let students = foundStudents.map(student => {
          return this.buildStudentData(student)
        })

        this.setState({
          students,
          status: this.buildFoundStudentsNote(students.length, name),
        })
      })
      .catch(err => {
        this.handleApiError(err)
      })
      .finally(() => {
        this.setState({ loading: false })
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
      hasVoted: student.has_voted
    }
    return data
  }

  selectStudent(student) {
    this.setState({
      activeStudent: student,
      activeStudentName: student.name,
      status: 'Введіть номер підтверджуючого документа',
      showConsentDialog: true,
    })
  }

  confirmConsent() {
    this.setState({ showConsentDialog: false })
  }

  cancelConsent() {
    this.setState({ showConsentDialog: false })
    this.unselectStudent()
  }

  registerStudent(student) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.student = {}
    data.student.token = student.token
    data.student.doc_type = student.docType
    data.student.doc_num = student.docNumber

    this.setState({ loading: true })

    console.log(`Submitting student with doctype ${data.student.doc_type}`)

    axios.post('/register_student', data)
      .then(res => {
        if (res.data.error) {
          // if error code is NOT 304  
          // OR there's NO ballot number in response object context
          // handle error code
          if (res.data.error.code !== 304 || !res.data.error.context.ballot_number) return this.handleErrorCode(res.data.error.code)

          // otherwise
          // show registration complete as if nothing happened
          let ballotNumber = res.data.error.context.ballot_number
          this.setState({ showRegistrationComplete: true, ballotNumber })
          return
        }
        let ballotNumber = res.data.data.ballot_number
        this.setState({ showRegistrationComplete: true, ballotNumber })
      })
      .catch(err => {
        this.handleApiError(err)
      })
      .finally(() => {
        this.setState({ loading: false })
      })
  }

  searchGoBack() {
    console.log('Going back to Search...')
    this.setState({
      students: [],
      status: 'Знайдіть студента в базі',
    })
    this.searchStudentByTicketNumberStarted = false
  }

  unselectStudent() {
    console.log('Unselecting student...')
    this.setState({
      activeStudent: null,
      status: this.buildFoundStudentsNote(this.state.students.length, this.state.searchQuery),
    })
  }

  completeSession = (config) => {
    config.check_in_session_token = this.state.checkInSessionToken
    axios.post('/complete_session', config)
      .then(res => {
        // 508 - already closed
        if (res.data.error && res.data.error.code !== 508) return this.handleErrorCode(res.data.error.code)
        const studentName = this.state.activeStudentName
        this.setState({
          showRegistrationComplete: false,
          studentSubmitted: studentName,
          showCompleteSession: true,
        })
      })
      .catch(err => {
        this.handleApiError(err)
      })
      .finally(() => {
        this.setState({ loading: false })
      })
  }

  handleApiError(err) {
    console.warn('Handling API error:', err)
    if (!err.status && !err.response) return this.handleErrorCode(513) // network error
    this.handleErrorCode(300, { err })
  }

  handleErrorCode(code, options = {}) {
    if (code === 518 || code === 519) {
      this.onExpiredAuth()
    }

    let error = ERRORS[code] || {
      title: `Упс, такої помилки не очікували`,
      message: 'Команда підтримки вже поінформована про проблему 😌',
      icon: ICONS.bug,
    }

    Raven.captureException(
      options.err || `${error.title} – ${error.message}`,
      {
        user: {
          name: this.state.auth.user
        }
      }
    )

    if (!options.silent) {
      showNotification({
        title: error.title,
        message: error.message,
        icon: error.icon,
      })
    }
  }

  cancelSession() {
    const token = { check_in_session_token: this.state.checkInSessionToken }

    console.log('Canceling session...')
    this.setState({ loading: true })
    axios.post('/cancel_session', token)
      .then(res => {
        if (res.data.error) this.handleErrorCode(res.data.error.code, { silent: true })
        this.onSessionEnd()
      })
      .catch(err => {
        this.handleApiError(err)
      })
      .finally(() => {
        this.setState({ loading: false })
      })
  }

  onExpiredAuth() {
    clearInterval(this.pulse)
    localStorage.setItem('authToken', '')
    this.setState({ auth: initialState.auth }, () => { this.onSessionEnd() })
  }

  onSessionEnd() {
    this.barcodeScanned = false
    this.setState({ ...initialState, auth: this.state.auth })
    try {
      Quagga.stop()
    } catch (err) { }
  }

  logout = () => {
    axios
      .post('/logout')
      .then(res => {
        if (res.data.error) return this.handleErrorCode(res.data.error.code)
        this.onExpiredAuth()
      })
      .catch(err => {
        this.handleApiError(err)
      })
  }

  initScan() {
    this.setState({ loading: true })
    this.barcodeScanned = false
    Quagga.init(
      { ...QUAGGA_OPTIONS, inputStream: { ...QUAGGA_OPTIONS.inputStream, target: document.querySelector('.scanner-container') } },
      (err) => {
        if (err) {
          this.handleErrorCode(506)
          return
        }
        Quagga.start()
        this.setState({
          loading: false
        })
        this.initOnDetected()
      })
  }

  cancelScan() {
    Quagga.stop();
    this.setState({
      status: 'Введіть номер підтверджуючого документа',
    })
  }

  initOnDetected() {
    Quagga.onDetected((data) => {
      // prevent multi-requests
      if (this.barcodeScanned) return

      const number = data.codeResult.code
      if (number.length === 8) {
        console.log('Successfuly scanned ticket...')
        this.barcodeScanned = true
        Quagga.stop()

        let activeStudent = this.state.activeStudent
        activeStudent.docNumber = number
        activeStudent.docType = '0'

        let scannerSeed = Math.random()
        this.setState({ activeStudent, scannerSeed })
      } else {
        this.handleErrorCode(507)
      }
    })
  }

}