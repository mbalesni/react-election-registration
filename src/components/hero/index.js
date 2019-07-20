import React from 'react';
import voters from './together-cropped-table.svg'
import children from './children.svg'
import useStoreon from 'storeon/react'
import './index.css'

export default function Hero() {
  const { auth } = useStoreon('auth')
  return (
    <div className="hero-container">
      <img id="hero" src={auth.isElectionTime ? voters : children} />
    </div>
  )
}
