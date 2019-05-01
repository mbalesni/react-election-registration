import React from 'react';
import Button from '@material-ui/core/Button';
import { ICONS } from '../../utils/icons.js'
// import { localDateTimeFromUTC } from '../../utils/functions.js'
import CONFIG from '../../config.js'
import votingImg from './plain-hero.jpg'
import './index.css'


export default function NewSessionWindow(props) {
  const iconRight = {
    marginRight: '8px',
    fontSize: '18px',
    marginBottom: '2px'
  }

  // const dateStyle = {
  //   marginTop: '2rem'
  // }

  const electionName = CONFIG.ELECTION_NAME

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
    <div className="card new-session-card">
      <div style={{ position: 'relative' }}>
        <img src={votingImg} alt="" />

        <div className="election-text">
          <div className="election-heading">Е-Реєстрація</div>

          {electionName}

          {/* <div style={dateStyle}>{date}</div> */}
          {/* <div style={dateStyle}>{startTime}</div> */}
          {/* <div style={dateStyle}>{endTime}</div> */}
        </div>
      </div>
      <div className="card-footer">
        <Button disabled={props.loading} variant="contained" color="primary" onClick={props.onSessionStart}>
          <i className={ICONS.userCheck} style={iconRight}></i>
          Зареєструвати виборця
        </Button>
      </div>
    </div>
  )
}
