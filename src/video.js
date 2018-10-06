import React from 'react';
import { Button } from '@material-ui/core'

import './css/video.css'

export default function Video(props) {
  return (
    <div className={"overlay " + (props.show ? 'show' : '')}>
      <div className="scanner-container-top">
        <div className={"video-card " + (props.show ? 'show' : '')}>
          <div id="video" className="scanner-container" ></div>
          <div className="card-actions">
            <Button disabled={props.loading} onClick={props.onCancel} color="default">назад</Button>
          </div>
        </div>
      </div>
    </div>

  )
}
