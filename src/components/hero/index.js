import React from 'react';
import voters from './together-cropped-table.svg'
import children from './children.svg'
import './index.css'


export default function Hero(props) {
  return (
    <div className="hero-container">
      <img id="hero" src={props.isElectionTime ? voters : children} />
    </div>
  )
}
