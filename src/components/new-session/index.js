import React from 'react';
import Button from '@material-ui/core/Button';
import { ICONS } from '../../utils/icons.js'
import CONFIG from '../../config.js'
import logo from './cvk-logo.png'
import useStoreon from 'storeon/react'
import './index.css'


export default function NewSession() {
  const { auth, appGlobal, dispatch } = useStoreon('auth', 'appGlobal')
  const { loading } = appGlobal
  const { isElectionTime } = auth

  const iconRight = {
    marginRight: '8px',
    fontSize: '18px',
    marginBottom: '2px'
  }

  const electionType = CONFIG.ELECTION_TYPE
  const electionTitle = CONFIG.OFFICIAL_TITLE

  const startSession = () => {
    dispatch('session/start')
  }

  return (
    <>
      <div className="new-session-container">
        <div className="logo-container">
          <img alt="Логотип ЦВК студентів КНУ" className="logo" src={logo} logo="Логотип ЦВК студентів КНУ" />
        </div>
        <div className="election-text">
          <div className="election-type">{electionType}</div>
          <div className="blue-strip">
            {!loading && isElectionTime ? electionTitle : 'Зараз не час виборів'}
            {loading && 'Стартуємо...'}
          </div>
        </div>
        {isElectionTime && <div className="card-footer">
          <Button disabled={loading} variant="contained" color="secondary" onClick={startSession}>
            <i className={ICONS.userCheck} style={iconRight}></i>
            Зареєструвати виборця
        </Button>
        </div>}

      </div >
    </>
  )
}
