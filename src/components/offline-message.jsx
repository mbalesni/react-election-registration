import React from 'react'
import styled from 'styled-components'

const MessageBar = styled.div`
    background-color: #2196f3;
    box-sshadow: 0 5px 10px rgba(0, 0, 0, 0.2);
    color: white;
    position: absolute;
    top: 48px;
    left: 50%;
    transform: translateX(-50%);
    padding: 1rem;
    border-radius: 12px;
`

function OfflineMessage() {
    return <MessageBar>Waiting for connection...</MessageBar>
}

export default OfflineMessage
