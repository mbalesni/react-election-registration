import React from 'react'
import NumberBox from './number-box'
import Button from '@material-ui/core/Button'
import './css/ballot.css'


export default class Ballot extends React.Component {
    render() {
        let { number } = this.props

        number = number.toString().match(/.{1,2}/g)

        return (
            <div className="ballot-wrapper">
                <div className="ballot">
                    <h2>Виборчий бюлетень</h2>
                    <div className="number">
                        Номер бюлетеня: &nbsp;
                        <NumberBox number={number[0]} />
                        –
                        <NumberBox number={number[1]} />
                        –
                        <NumberBox number={number[2]} />
                        –
                        <NumberBox number={number[3]} />
                    </div>

                    <div className="check-in-controls">
                        <Button onClick={this.props.onCancel} color="secondary">скасувати</Button>
                        <Button onClick={this.props.onComplete} variant="contained" color="primary">видано</Button>
                    </div>
                </div>
            </div>
        )
    }

}