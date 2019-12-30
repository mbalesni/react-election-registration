import React from 'react'
import { Button } from '@material-ui/core'
import { ICONS } from '../../utils/icons.js'

import './index.css'

export default function Scanner(props) {
    const iconStyle = {
        marginRight: '8px',
        fontSize: '20px',
        color: '#2196f3',
    }

    let { loading } = props

    return (
        <div className={'overlay ' + (props.show ? 'show' : '')}>
            <div className="scanner-container-top">
                <div className={'video-card ' + (props.show ? 'show' : '')}>
                    <div className="video-footer">
                        {!loading && (
                            <div className="video-footer-title">
                                <i
                                    className={ICONS.camera}
                                    style={iconStyle}
                                ></i>
                                Student ID Scanning
                            </div>
                        )}
                        <Button
                            disabled={props.loading}
                            onClick={props.onCancel}
                            color="default"
                        >
                            Back
                        </Button>
                    </div>
                    {loading && (
                        <p className="loading-message">Starting scanning...</p>
                    )}
                    <div id="video" className="scanner-container"></div>
                </div>
            </div>
        </div>
    )
}
