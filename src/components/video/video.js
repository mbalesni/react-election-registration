import React from 'react';
import { Button } from '@material-ui/core'
import { ICONS } from '../../utils/icons.js'

import './video.css'

export default function Video(props) {

  const iconStyle = {
    marginRight: '8px',
    fontSize: '20px',
    color: '#2196f3'
  }

  let { loading } = props

  return (
    <div className={"overlay " + (props.show ? 'show' : '')}>
      <div className="scanner-container-top">
        <div className={"video-card " + (props.show ? 'show' : '')}>
          {loading &&
            <p className="loading-message" >Запуск сканування...</p>
          }
          <div id="video" className="scanner-container" ></div>
          <div className="video-footer">
            {!loading &&
              <div className="video-footer-title">
                <i className={ICONS.camera} style={iconStyle}></i>
                Сканування студентського квитка
            </div>}
            <Button disabled={props.loading} onClick={props.onCancel} color="default">назад</Button>
          </div>
        </div>
      </div>
    </div>

  )
}
