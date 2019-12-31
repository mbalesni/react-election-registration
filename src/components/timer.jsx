import React, { useState, useEffect, useRef } from 'react'

function Timer(props) {
    let [elapsed, setElapsed] = useState(false)
    let [timeLeft, setTimeLeft] = useState(props.timeout)

    useInterval(() => {
        if (elapsed) return
        if (timeLeft <= 0) {
            setElapsed(true)
            return props.onElapsed()
        }
        setTimeLeft(timeLeft - 1)
    }, 1000)

    return <span style={props.style}>({timeLeft})</span>
}

function useInterval(callback, delay) {
    const savedCallback = useRef()

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback
    })

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current()
        }
        if (delay !== null) {
            let id = setInterval(tick, delay)
            return () => clearInterval(id)
        }
    }, [delay])
}

export default Timer
