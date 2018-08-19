import React from 'react'
import Paper from '@material-ui/core/Paper'
import './css/statistics.css'

export default function Statistics(props) {
  const registered = 5
  return (
    <div className="statistics">
      <Paper style={{padding: 24}} elevation={1}>
        <div>Я зареєстрував</div>

        <strong className="number">{registered}</strong>
        <div>студентів</div>
      </Paper>
    </div>


  )
}
