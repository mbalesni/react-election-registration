import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import { BarLoader } from 'react-spinners';
import { css } from 'react-emotion';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Divider from '@material-ui/core/Divider';
import './index.css'
import { ICONS } from '../../utils/icons'
import useStoreon from 'storeon/react'
import CONFIG from '../../config'

const { ADMIN_PANEL_URL } = CONFIG

const ico = {
  marginRight: '8px',
  marginBottom: '2px',
}

const userIco = {
  fontSize: '1.2em',
  marginRight: '6px',
  marginBottom: '2px',
}


function Header(props) {
  const [anchorEl, setAnchorEl] = useState(null)
  const { auth, appGlobal, dispatch } = useStoreon('auth', 'appGlobal')
  const { loggedIn, structuralUnit, user } = auth
  const { loading } = appGlobal

  const open = Boolean(anchorEl);

  const loadingBar = css`
      position: absolute !important;
      top: 0;
  `

  const handleMenu = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = event => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleClose()
    dispatch('auth/logout')
  }

  return (
    <>
      <BarLoader
        color="rgba(33, 150, 243, 0.8)"
        className={loadingBar}
        loading={loading}
        width={100}
        widthUnit={"%"}
        height={3}
      />
      <header>
        {loggedIn && (
          <>
            <div className="structural-unit">{structuralUnit}</div>
            <div className="app-menu">
              <Button
                aria-owns={open ? 'menu-appbar' : null}
                aria-haspopup="true"
                aria-label={user}
                onClick={handleMenu}
                color="inherit"
                className="app-menu-btn"
              >
                <i className={ICONS.user} style={userIco}></i>
                <span className="user-name">{user}</span>
              </Button>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={open}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  <i className={ICONS.user} style={userIco}></i>
                  {user}
                </MenuItem>
                <a href={ADMIN_PANEL_URL} target="_blank" rel="noreferrer noopener">
                  <MenuItem>
                    <i className={ICONS.admin} style={ico}></i>
                    Адмін панель
                  </MenuItem>
                </a>
                <Divider />
                <MenuItem onClick={handleLogout.bind(this)}>
                  <i className={ICONS.logout} style={ico}></i>
                  Вийти
                  </MenuItem>
              </Menu>

            </div>
          </>
        )}
      </header>
    </>
  )

}

export default Header