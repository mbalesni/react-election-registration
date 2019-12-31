import React from 'react'
import Button from '@material-ui/core/Button'
import { ICONS } from '../../utils/icons.js'
import CONFIG from '../../config.js'
import logo from './cvk-logo.png'
import useStoreon from 'storeon/react'
import './index.css'

export default function NewSession() {
    const { auth, appGlobal, dispatch } = useStoreon('auth', 'appGlobal')
    const { loading, isOnline } = appGlobal
    const { isElectionTime } = auth

    const iconRight = {
        marginRight: '8px',
        fontSize: '18px',
        marginBottom: '2px',
    }

    const electionType = CONFIG.ELECTION_TYPE
    const electionTitle = CONFIG.ELECTION_NAME

    const startSession = () => {
        dispatch('session/start')
    }

    return (
        <>
            <div className="new-session-container">
                <div className="logo-container">
                    <img
                        alt="Logo of the Central Election Comission of KNU"
                        className="logo"
                        src={logo}
                    />
                </div>
                <div className="election-text">
                    <div className="election-type">{electionType}</div>
                    <div className="blue-strip">
                        {!loading &&
                            (isElectionTime
                                ? electionTitle
                                : "It's not election time.")}
                        {loading && 'Starting...'}
                    </div>
                </div>
                {isElectionTime && (
                    <div className="card-footer">
                        <Button
                            disabled={loading || !isOnline}
                            variant="contained"
                            color="secondary"
                            onClick={startSession}
                        >
                            <i
                                className={ICONS.userCheck}
                                style={iconRight}
                            ></i>
                            Check in to Vote
                        </Button>
                    </div>
                )}
            </div>
        </>
    )
}
