import React from 'react';
import img from './together-cropped-table.svg'
import './index.css'


export default function Hero(props) {
  return (
    <div className={"hero-container " + (props.sessionIsOpen ? 'move-right' : '')}>
      <img id="hero" src={img} />
    </div>
  )
}
