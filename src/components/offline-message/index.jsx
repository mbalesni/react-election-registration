import React from 'react'

const style = {
    backgroundColor: '#2196f3',
    boxShadow: '0 5px 10px rgba(0, 0, 0, .2)',
    color: 'white',
    position: 'absolute',
    top: 48,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '1rem',
    borderRadius: '12px',
}

function OfflineMessage() {
    return <div style={style}>Waiting for connection...</div>
}

export default OfflineMessage
