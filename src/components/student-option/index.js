import React, { useState, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import CONFIG from '../../config'
import useStoreon from 'storeon/react'
import './index.css'

const { PRINT_BALLOTS } = CONFIG

export default function StudentOption(props) {
  const [disabled, setDisabled] = useState(false)
  const [isActiveStudent, setIsActiveStudent] = useState(false)
  const { session, dispatch } = useStoreon('session')
  const { activeStudent } = session

  const handleSelect = (student) => {
    console.log(`Selecting student...`)
    dispatch('session/selectStudent', student)

    setDisabled(true)
  }


  useEffect(() => {
    let disabled = false
    let isActiveStudent = false
    if (activeStudent.name === props.data.name) {
      disabled = true
      isActiveStudent = true
    }
    if (props.data.hasVoted === true && !PRINT_BALLOTS) disabled = true
    setDisabled(disabled)
    setIsActiveStudent(isActiveStudent)
  }, [setDisabled, setIsActiveStudent, activeStudent.name, props.data.name, props.data.hasVoted])

  const { data } = props
  const { name, hasVoted } = data
  const additionalInfo = data.data
  const student = data

  let classes = ['student']

  if (disabled) classes.push('disabled')

  const button = {
    name: '',
    color: '',
  }

  switch (hasVoted) {
    case false:
      button.name = 'Зареєструвати'
      button.color = 'primary'
      break
    case true:
      button.name = PRINT_BALLOTS ? 'Повторний бюлетень' : 'Зареєстровано'
      button.color = PRINT_BALLOTS ? 'secondary' : 'primary'
      break
    default:
      button.name = 'Зареєструвати'
      button.color = 'primary'
  }

  let fieldNames = Object.keys(additionalInfo)
  let studentInfo = []
  fieldNames.forEach((field, i) => {
    const value = additionalInfo[field]
    if (value) {
      const optionalBar = (i === 0) ? '' : ' | '
      studentInfo.push(<span key={field}>{optionalBar + value}</span>)
    }
  })

  return (
    <div className={classes.join(' ')}>
      <div className="data">
        <div className="student--name">{name}</div>
        <div className="student--info">
          {studentInfo}
        </div>
      </div>

      <div className="actions">
        {!isActiveStudent &&
          <Button disabled={disabled} variant="text" color={button.color} onClick={() => { handleSelect(student) }}>
            {button.name}
          </Button>
        }
      </div>

    </div>
  )

}
