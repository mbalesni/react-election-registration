import React from 'react'
import Raven from 'raven-js'
import { MuiThemeProvider } from '@material-ui/core/styles';
import Session from './components/session'
import NewSession from './components/new-session'
import ConsentDialog from './components/consent-window'
import RegistrationCompleteWindow from './components/registration-complete-window'
import Header from './components/header'
import Footer from './components/footer'
import { THEME } from './utils/theme.js'
import '../node_modules/izitoast/dist/css/iziToast.min.css'
import './utils/override-izitoast.css'
import Login from './components/login';
import SessionCompleteWindow from './components/session-complete-window';
import PrintingWindow from './components/printing-window/index.js';
import connect from 'storeon/react/connect'
import PrinterPicker from './components/printer-picker'
import OfflineMessage from './components/offline-message'

class App extends React.Component {
  componentWillMount() {
    let storedAuthToken = localStorage.getItem('authToken')
    if (storedAuthToken) {
      this.props.dispatch('auth/get')
    }
  }

  componentDidCatch(err, errInfo) {
    Raven.captureException(
      err,
      {
        extra: errInfo,
        user: {
          name: this.props.auth.user
        }
      }
    )
  }

  render() {
    const { loggedIn } = this.props.auth
    const { endSession, isOpen, showRegistrationComplete, showCompleteSession, showConsentDialog } = this.props.session
    const { showPrintingWindow, showPrinterPicker } = this.props.printer
    const { isOnline } = this.props.appGlobal
    if (endSession) this.onSessionEnd()

    return (
      <MuiThemeProvider theme={THEME}>
        <div className="page-content-wrapper " >
          <div className="header-and-content">
            <Header />
            {!isOnline && <OfflineMessage />}
            <div className="content">
              <div className="card-perspective">
                <div className="card">
                  {loggedIn  && isOpen  && <Session />}
                  {loggedIn  && !isOpen && <NewSession />}
                  {!loggedIn &&            <Login /> }
                </div>
              </div>
              {showRegistrationComplete && <RegistrationCompleteWindow /> }
              {showPrinterPicker && <PrinterPicker />}
              {showPrintingWindow && <PrintingWindow /> }
              {showConsentDialog && <ConsentDialog /> }
              <SessionCompleteWindow
                open={showCompleteSession}
              />
            </div>
          </div>
          <Footer />
        </div>
      </MuiThemeProvider>
    )
  }

}

export default connect('auth', 'session', 'appGlobal', 'printer', App)