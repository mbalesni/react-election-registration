import React from 'react';
import Button from '@material-ui/core/Button';
import { ICONS } from '../../utils/icons.js'
import votingImg from './hero.png'


export default function NewSessionWindow(props) {
  const iconRight = {
    marginRight: '8px',
    fontSize: '18px',
    marginBottom: '2px'
  }

  return (
    <div className="card new-session-card">
      <img src={votingImg} alt="" />
      <div className="card-footer">
        <Button disabled={props.loading} variant="contained" color="primary" onClick={props.onSessionStart}>
          <i className={ICONS.userCheck} style={iconRight}></i>
          Зареєструвати виборця
        </Button>
      </div>
    </div>
  )
}
