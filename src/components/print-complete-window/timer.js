import React from 'react'



export default class Timer extends React.Component {
    state = {
        timeLeft: this.props.startAtSeconds,
        elapsed: false
    }

    componentDidMount = () => {
        setInterval(this.tick, 1000)
    }

    tick = () => {
        const { timeLeft, elapsed } = this.state
        if (elapsed) return
        if (timeLeft <= 0) {
            this.props.onElapsed()
            this.setState({ elapsed: true })
            return
        }
        this.setState({
            timeLeft: timeLeft - 1
        })
    }

    render() {
        const { timeLeft } = this.state
        return (
            <span style={this.props.style}>({timeLeft})</span>
        )
    }
}