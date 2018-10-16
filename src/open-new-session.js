import React from 'react';
import Button from '@material-ui/core/Button';
import { ICONS } from './icons.js'
import votingImg from './img/voting.png'

export default function OpenNewSession(props) {
  const iconRight = {
    marginRight: '8px',
    fontSize: '18px',
    marginBottom: '2px'
  }

  return (
    <div className="card new-session-card">
      <img src={votingImg} alt="" />
      <div className="card-footer">
        <Button disabled={props.loading} variant="contained" color="primary" onClick={props.onSessionOpen}>
          <i className={ICONS.userCheck} style={iconRight}></i>
          зареєструвати виборця
        </Button>
      </div>
    </div>
  )
}
