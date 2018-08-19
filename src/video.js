import React from 'react';

export default function Video(props) {
  return (
    <div className="scanner-container-top">
      <div id="video" className={"scanner-container " + (props.show ? 'show' : '')} >
      </div>
    </div>

  )
}
