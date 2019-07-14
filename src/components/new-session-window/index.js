import React from 'react';
import Button from '@material-ui/core/Button';
import { ICONS } from '../../utils/icons.js'
// import { localDateTimeFromUTC } from '../../utils/functions.js'
import CONFIG from '../../config.js'
import logo from './cvk-logo.png'
import './index.css'


export default function NewSessionWindow(props) {
  const { isElectionTime, loading } = props

  const iconRight = {
    marginRight: '8px',
    fontSize: '18px',
    marginBottom: '2px'
  }

  // const dateStyle = {
  //   marginTop: '2rem'
  // }

  const electionType = CONFIG.ELECTION_TYPE
  const electionTitle = CONFIG.OFFICIAL_TITLE

  let disableNewSession = false
  if (loading || !isElectionTime) disableNewSession = true



  // const startDatetime = localDateTimeFromUTC(props.startTimestamp)
  // console.log(startDatetime)
  // const endDateTime = localDateTimeFromUTC(props.endTimestamp)

  // const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  // const timeOptions = { hour: 'numeric', minute: 'numeric' }

  // let date
  // let startTime
  // let endTime

  // try {
  //   date = startDatetime && startDatetime.toLocaleDateString("UK", dateOptions)
  //   startTime = startDatetime && startDatetime.toLocaleDateString("UK", timeOptions)
  //   endTime = endDateTime && endDateTime.toLocaleDateString("UK", timeOptions)
  // } catch (err) {
  //   console.warn(err)
  // }


  // const startString = startDatetime.
  // const endTime = props.endTimestamp

  return (
    <>
      <div className="new-session-container">
        <div className="logo-container">
          <img className="logo" src={logo} logo="Логотип ЦВК студентів КНУ" />
        </div>
        <div className="election-text">
          <div className="election-type">{electionType}</div>

          <div className="blue-strip">
            {!loading && isElectionTime ? electionTitle : 'Зараз не час виборів'}
            {loading && 'Стартуємо...'}
          </div>
          {/* <div style={dateStyle}>{date}</div> */}
          {/* <div style={dateStyle}>{startTime}</div> */}
          {/* <div style={dateStyle}>{endTime}</div> */}
        </div>
        {isElectionTime && <div className="card-footer">
          <Button disabled={loading} variant="contained" color="secondary" onClick={props.onSessionStart}>
            <i className={ICONS.userCheck} style={iconRight}></i>
            Зареєструвати виборця
        </Button>
        </div>}

      </div >
    </>
  )
}
