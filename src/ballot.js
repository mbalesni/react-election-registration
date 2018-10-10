import React from 'react'
import NumberBox from './number-box'
import Button from '@material-ui/core/Button'
import { ICONS } from './icons.js'
import { Alert } from 'antd'

import './css/ballot.css'


export default class Ballot extends React.Component {
    numberBoxes(numArr) {
        return numArr.map(num => <NumberBox number={num} />)
    }

    render() {
        const { number, status, loading, onCancel, onComplete } = this.props
        const numberArr = number.toString().match(/.{1,2}/g)

        return (
            <div className="overlay show">
                <div className="ballot-wrapper">
                    <div className="ballot">
                        <div className="ballot-content">
                            <Alert className="instruction" message={status.message} showIcon type={status.type} />
                            <div className="number-wrapper">
                                <div className="number">{this.numberBoxes(numberArr)}</div>
                            </div>
                        </div>
                        <div className="check-in-controls">
                            <Button disabled={loading} onClick={onCancel} color="secondary">скасувати</Button>
                            <Button disabled={loading} onClick={onComplete} variant="contained" color="primary">видано</Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}