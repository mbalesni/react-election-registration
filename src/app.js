import React from 'react'
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
import CONFIG, { API } from './config.js'
import { shouldIgnoreRegError } from './utils/functions'
import PrintingWindow from './components/printing-window/index.js';
import Hero from './components/hero'

const { ASK_CONSENT, PRINT_BALLOTS } = CONFIG

const initialState = {
  activeStudent: null,
  activeStudentName: '',
  ballotIsPrinted: false,
  auth: { loggedIn: false, user: '', structuralUnit: '' },
  ballotNumber: null,
  docNumber: null,
  docType: null,
  sessionIsOpen: false,
  checkInSessionToken: null,
  students: [],
  loading: false,
  showRegistrationComplete: '',
  showPrintingWindow: false,
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
    const {
      ballotNumber,
      ballotIsPrinted,
      isElectionTime,
      loading,
      printerError,
      sessionIsOpen,
      showConsentDialog,
      showCompleteSession,
      showPrintingWindow,
      showRegistrationComplete,
    } = this.state

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



              <div className={"card-perspective " + (loggedIn ? 'with-perspective' : '')}>
                <div className="card">

                  {!loggedIn &&
                    <LoginWindow
                      onSuccess={this.onSuccessfulLogin}
                      handleApiError={this.handleApiError.bind(this)}
                      handleErrorCode={this.handleErrorCode.bind(this)}
                    />
                  }

                  {loggedIn && !sessionIsOpen &&
                    <NewSessionWindow
                      isElectionTime={isElectionTime}
                      data={this.state.auth}
                      onSessionStart={this.startSession.bind(this)}
                      loading={loading}
                    />
                  }


                  {sessionIsOpen &&
                    <SessionWindow
                      activeStudent={this.state.activeStudent}
                      scannerSeed={this.state.scannerSeed}
                      status={this.state.status}
                      students={this.state.students}
                      onSearchBack={this.searchGoBack.bind(this)}
                      onStudentSubmit={this.submitStudent.bind(this)}
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


                </div>
              </div>



              {loggedIn &&
                <Hero isElectionTime={isElectionTime} />
              }



              {showRegistrationComplete &&
                <RegistrationCompleteWindow
                  number={ballotNumber}
                  onComplete={this.completeSession.bind(this)}
                  onCancel={this.cancelSession.bind(this)}
                />
              }

              {showPrintingWindow &&
                <PrintingWindow
                  ballotIsPrinted={ballotIsPrinted}
                  error={printerError}
                  onComplete={this.completeSession.bind(this)}
                  onCancel={this.cancelSession.bind(this)}
                  onError={this.handlePrinterError.bind(this)}
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

    return API.back.post('/me', {})
      .then(res => {
        if (res.data.error) return this.handleErrorCode(res.data.error.code)
        const { first_name, last_name, structural_unit_name, vote_start_timestamp, vote_end_timestamp } = res.data.data.staff
        const currentTime = Date.now()
        let isElectionTime = false
        if (currentTime > vote_start_timestamp && currentTime < vote_end_timestamp) isElectionTime = true
        this.setState({
          auth: {
            loggedIn: true,
            user: `${first_name} ${last_name}`,
            structuralUnit: structural_unit_name,
            voteStartTimestamp: vote_start_timestamp,
            voteEndTimestamp: vote_end_timestamp,
          },
          isElectionTime,
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

    API.back.post('/me', {})
      .then(res => {
        if (res.data.error) this.handleErrorCode(res.data.error.code)
      })
      .catch(err => {
        this.handleApiError(err)
      })
  }

  onSuccessfulLogin = () => {
    this.getAuth()
      .then(this.closeSessions)

    this.pulseInterval = setInterval(this.pulse, CONFIG.PULSE_INTERVAL * 1000)
  }

  closeSessions() {
    API.back.post('/close_sessions', {})
      .catch(err => {
        console.warn(err)
      })
  }

  startSession() {
    console.log('Starting new session...')
    this.setState({ loading: true })
    API.back.post('/start_new_session', {})
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

    API.back.post('/search_by_name', data)
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
      name: student.full_name,
      token: student.token,
      hasVoted: student.has_voted,
      data: student.data,
    }
    return data
  }

  selectStudent(student) {
    this.setState({
      activeStudent: student,
      activeStudentName: student.name,
      status: '',
      showConsentDialog: ASK_CONSENT,
    })
  }

  confirmConsent() {
    this.setState({ showConsentDialog: false })
  }

  cancelConsent() {
    this.setState({ showConsentDialog: false })
    this.unselectStudent()
  }

  async submitStudent(student) {
    const ballotNumber = await this.registerStudent(student)
    if (PRINT_BALLOTS) {
      this.printBallot(ballotNumber)
    } else {
      this.setState({ showRegistrationComplete: true, ballotNumber })
    }
  }

  printBallot(number) {
    this.setState({ showPrintingWindow: true })
    API.printer.post('/print_ballot', { number })
      .then(res => {
        this.setState({ ballotIsPrinted: true })
      })
      .catch(err => {
        this.setState({ printerError: err.message })
        this.handleApiError(err)
      })
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

    return API.back.post('/register_student', data)
      .then(res => {
        let ballotNumber
        if (res.data.error) {
          const ignore = shouldIgnoreRegError(res.data.error)
          if (!ignore) return this.handleErrorCode(res.data.error.code)
          ballotNumber = res.data.error.context.ballot_number
        }
        if (!ballotNumber) ballotNumber = res.data.data.ballot_number
        return ballotNumber
      })
      .catch(err => {
        this.handleApiError(err)
      })
      .finally((ballotNumber) => {
        this.setState({ loading: false })
        return ballotNumber
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
    API.back.post('/complete_session', config)
      .then(res => {
        // 508 - already closed
        if (res.data.error && res.data.error.code !== 508) return this.handleErrorCode(res.data.error.code)
        const studentName = this.state.activeStudentName
        this.setState({
          showRegistrationComplete: false,
          studentSubmitted: studentName,
          showCompleteSession: true, // show if no printererror
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
    if ([517, 518, 519].includes(code)) {
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

  handlePrinterError() {
    this.setState({ showPrintingWindow: false, printerError: null })
  }

  cancelSession() {
    const token = { check_in_session_token: this.state.checkInSessionToken }

    console.log('Canceling session...')
    this.setState({ loading: true })
    API.back.post('/cancel_session', token)
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
    clearInterval(this.pulseInterval)
    localStorage.removeItem('authToken')
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
    API.back
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
          this.setState({ loading: false })
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
      status: '',
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