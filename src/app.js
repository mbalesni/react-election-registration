import React, { Fragment } from 'react'
import axios from 'axios'
import Raven from 'raven-js'
import Quagga from 'quagga'
import { MuiThemeProvider } from '@material-ui/core/styles';
import { QUAGGA_OPTIONS } from './plugins/quagga-options.js'
import SessionWindow from './components/session-window/session-window.js'
import NewSessionWindow from './components/new-session-window/new-session-window.js'
import Header from './components/page/header.js'
import Footer from './components/page/footer.js'
import { THEME } from './theme.js'
import { BarLoader } from 'react-spinners';
import { css } from 'react-emotion';
import { message } from 'antd'
import iziToast from 'izitoast'
import { ICONS } from './utils/icons.js'
import '../node_modules/izitoast/dist/css/iziToast.min.css'
import './utils/override-izitoast.css'
import * as errors from './utils/errors.json';
import LoginWindow from './login-window.js'

const spinnerStyles = css`
  position: absolute !important;
`

// retrieving environment variables
const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL || 'http://localhost:8000'
const PRINTAPP_BASE_URL = process.env.REACT_APP_PRINTAPP_HOST_URL || 'http://localhost:8012'

axios.defaults.baseURL = BACKEND_BASE_URL
axios.defaults.withCredentials = true

const initialState = {
  activeStudent: null,
  auth: { loggedIn: false, user: '' },
  ballotNumber: null,
  docNumber: null,
  docType: null,
  doRevoke: false,
  sessionIsOpen: false,
  checkInSessionToken: null,
  students: [],
  loading: false,
}

export default class App extends React.Component {
  state = { ...initialState }

  render() {
    const { loggedIn } = this.state.auth
    const { loading } = this.state

    return (
      <div className="page-content-wrapper " >

        <MuiThemeProvider theme={THEME}>
          <div className="header-and-content">
            <Header auth={this.state.auth} onCloseSessions={this.closeSessions.bind(this)} />
            <BarLoader
              color="rgba(33, 150, 243, 0.8)"
              className={spinnerStyles}
              loading={this.state.loading}
              width={100}
              widthUnit={"%"}
              height={3}
            />

            <div className="content">
              {!loggedIn && <LoginWindow />}
              {loggedIn && !this.state.sessionIsOpen &&
                <NewSessionWindow onSessionStart={this.startSession.bind(this)} loading={loading} />
              }

              {loggedIn && this.state.sessionIsOpen &&
                <SessionWindow
                  activeStudent={this.state.activeStudent}
                  status={this.state.status}
                  students={this.state.students}
                  onSearchBack={this.searchGoBack.bind(this)}
                  onStudentSubmit={this.submitStudent.bind(this)}
                  onStudentSelect={this.selectStudent.bind(this)}
                  onScanStart={this.initScan.bind(this)}
                  onScanCancel={this.cancelScan.bind(this)}
                  onCancelSession={this.cancelSession.bind(this)}
                  onSearchByName={this.searchStudentByName.bind(this)}
                  onStudentUnselect={this.unselectStudent.bind(this)}
                  voteOptions={this.state.voteOptions}
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
    message.config({
      maxCount: 1,
      duration: 5
    })
    this.getAuth()
    this.closeSessions()

  }

  getAuth() {
    this.setState({ loading: true })

    axios.post('/me')
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
          },
          loading: false
        })
        // window.location.href = `${BASE_URL}/admin/login?next=/elists/front`

      })

  }

  closeSessions() {
    axios.post('/close_sessions')
      .catch(err => {
        console.warn(err)
      })
  }

  startSession() {
    console.log('Starting new session...')
    this.setState({ loading: true })
    axios.post('/start_new_session', {})
      .then(res => {
        if (!res.data.error) {
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
        } else {
          return this.registerError(res.data.error.code)
        }

      })
      .catch(err => {
        this.handleApiError(err)
      })
  }

  buildFoundStudentsNote(numOfStudents, query) {
    return (
      <Fragment>
        <div>{numOfStudents > 1 ? 'Оберіть' : 'Перевірте дані та зареєструйте'} студента</div>
        <div className="found-students-num">
          За запитом <strong>{query}</strong> знайдено {numOfStudents} студент{numOfStudents > 1 ? 'ів' : 'а'}
        </div>
      </Fragment>
    )
  }

  searchStudentByName(name) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.student = {}
    data.student.full_name = name

    console.log('Searching student by name:', name)

    this.setState({ loading: true })

    axios.post('/search_by_name', data)
      .then(res => {
        if (res.data.error) return this.registerError(res.data.error.code, false)

        const foundStudents = res.data.data.students
        let students = foundStudents.map(student => {
          return this.buildStudentData(student)
        })
        this.setState({
          students,
          status: {
            type: 'info',
            message: this.buildFoundStudentsNote(students.length, name),
          },
          loading: false
        })
      })
      .catch(err => {
        this.handleApiError(err)
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
      doRevoke: student.has_voted
    }
    return data
  }

  selectStudent(student, doRevoke) {
    this.setState({
      activeStudent: student,
      doRevoke,
      status: {
        type: 'info',
        message: 'Введіть номер підтверджуючого документа'
      }
    })
  }

  submitStudent(student) {
    let data = {}
    data.check_in_session_token = this.state.checkInSessionToken
    data.do_revoke_ballot = student.doRevoke
    data.student = {}
    data.student.token = student.token
    data.student.doc_type = student.docType
    data.student.doc_num = student.docNumber

    this.setState({ loading: true })

    console.log(`Submitting student with doc_num ${data.student.doc_num} (type ${data.student.doc_type}), token ${data.student.token}`)

    axios.post('/new_ballot', data)
      .then(res => {
        if (res.data.error) return this.registerError(res.data.error.code)

        let ballotNumber = res.data.data.ballot_number
        this.printBallot(ballotNumber)
        this.onSessionEnd()
        message.success(<span><strong>{student.name}</strong> – успішно зареєстровано.</span>, 5)


        this.setState({ loading: false })
      })
      .catch(err => {
        this.handleApiError(err)
      })
  }

  printBallot(number) {
    axios.post('/print_ballot', { number })
      .then(res => {
        if (res.data.error) return this.registerError(res.data.error.code)
        console.log(res)
      })
      .catch(err => {
        console.warn('PrintApp error', err)
      })
  }

  searchGoBack() {
    console.log('Going back to Search...')
    this.setState({
      students: [],
      status: {
        type: 'info',
        message: "Знайдіть студента в базі"
      }
    })
    this.searchStudentByTicketNumberStarted = false
  }

  unselectStudent() {
    console.log('Unselecting student...')
    this.setState({
      activeStudent: null,
    })
  }

  componentDidCatch(err, errInfo) {
    Raven.captureException(err, { extra: errInfo });
  }

  handleApiError(err) {
    console.warn('Handling API error:', err)
    console.log(err.status)

    // check Network Error
    if (!err.status && !err.response) {
      console.warn('[API ERROR HANDLER] Network error detected')
      this.registerError(513)
      return
    }

    switch (err.response.status) {
      case 400:
        // deal with bad requests
        break
      case 403:
        this.setState({ loading: false })
        message.warn('Відмовлено в доступі.')
        break
      default:
        this.registerError(300)
    }
  }

  registerError(code, silent = false, options) {
    this.setState({ loading: false })

    let error = errors[code]
    if (300 <= code && code < 400) {
      error = {
        title: 'Невідома помилка',
        message: 'Зверніться в службу підтримки',
        icon: ICONS.bug,
      }
    }
    if (!error) error = {}
    let title = `${error.title || 'Помилка'} [${code}]`

    if (!silent) {
      iziToast.show({
        title,
        message: error.message || '',
        icon: error.icon || ICONS.errorIcon,
        iconColor: '#fff',
        backgroundColor: '#E15240',
        position: 'topRight',
        titleColor: '#fff',
        messageColor: '#fff',
        maxWidth: '350px',
        layout: 2,
        timeout: false,
        transitionIn: 'bounceInLeft',
        resetOnHover: true,
        progressBar: false,
        drag: false,
        ...options
      })
    }

    console.log(title)
    Raven.captureException(new Error(title))
  }

  cancelSession() {
    const token = { check_in_session_token: this.state.checkInSessionToken }

    console.log('Canceling session...')
    this.setState({ loading: true })
    axios.post('/cancel_session', token)
      .then(res => {
        if (res.data.error) this.registerError(res.data.error.code, true)
        this.onSessionEnd()
      })
      .catch(err => {
        this.handleApiError(err)
      })
  }

  onSessionEnd() {
    message.destroy()
    this.barcodeScanned = false
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
    this.barcodeScanned = false
    Quagga.init(
      { ...QUAGGA_OPTIONS, inputStream: { ...QUAGGA_OPTIONS.inputStream, target: document.querySelector('.scanner-container') } },
      (err) => {
        if (err) {
          this.registerError(506)
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
      // prevent multi-requests
      if (this.barcodeScanned) return

      const number = data.codeResult.code
      if (number.length === 8) {
        console.log('Successfuly scanned ticket:', number)
        this.barcodeScanned = true
        message.destroy()
        Quagga.stop()

        let activeStudent = this.state.activeStudent
        activeStudent.docNumber = number
        activeStudent.docType = '0'
        this.setState({ activeStudent })
        message.success('Студентський квиток відскановано.')
        // iziToast.show({
        //   message: 'Студентський квиток відскановано.',
        //   icon: ICONS.check,
        //   iconColor: '#56A844',
        //   backgroundColor: '#fff',
        //   position: 'topCenter',
        //   transitionIn: 'bounceInDown',
        //   progressBar: false,

        // })

      } else {
        this.registerError(507)
      }
    })
  }

}