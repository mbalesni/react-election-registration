import React from 'react';
import Button from '@material-ui/core/Button';
import { ICONS } from '../../utils/icons.js'
import { localDateTimeFromUTC } from '../../utils/functions.js'
import votingImg from './plain-hero.jpg'


export default function NewSessionWindow(props) {
  const iconRight = {
    marginRight: '8px',
    fontSize: '18px',
    marginBottom: '2px'
  }

  const headingStyle = {
    fontSize: '1.8em',
    marginBottom: '1.5rem'
  }

  const textStyle = {
    position: 'absolute',
    top: 0,
    color: '#fff',
    fontFamily: '"Montserrat", sans-serif',
    textAlign: 'center',
    margin: '0 auto',
    left: 0,
    right: 0,
    padding: '2rem 2rem',
    fontSize: '1.5em',
    textTransform: 'uppercase',
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  }

  const dateStyle = {
    marginTop: '2rem'
  }

  const electionName = "Вибори голів Студентських рад гуртожитків і Голови Студентської ради Студмістечка КНУ"

  // const startDatetime = localDateTimeFromUTC(props.startTimestamp)

  // const startString = startDatetime.
  // const endTime = props.endTimestamp

  return (
    <div className="card new-session-card">
      <div style={{ position: 'relative' }}>
        <img src={votingImg} alt="" />

        <div style={textStyle}>
          <div style={headingStyle}>Е-Реєстрація</div>
          
          {electionName}

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
