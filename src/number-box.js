import React from 'react'
import './css/ballot.css'

export default function NumberBox(props) {
    const { number } = props

    return (
        <div className="number-box">
            {number}
        </div>
    )
}