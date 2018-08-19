import React from 'react';
import Button from '@material-ui/core/Button';

import votingImg from './img/voting.png'

export default function OpenNewSession(props) {
  return (
    <div className="card new-session-card">
      <img src={votingImg} alt="" />
      <div className="card-footer">
        <Button variant="contained" color="primary" onClick={props.onSessionOpen}>зареєструвати виборця</Button>
      </div>
    </div>
  )
}
