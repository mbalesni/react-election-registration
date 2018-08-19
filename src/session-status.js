import React from 'react'
import './css/session-status.css'

export default function SessionStatus(props) {
  let classes = ['status-bar', props.type]

  return (
    <div className={classes.join(' ')}>
      <p>{props.message}</p>
    </div>
  )
}
