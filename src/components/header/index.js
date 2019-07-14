import React from 'react';
import Button from '@material-ui/core/Button';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Divider from '@material-ui/core/Divider';
import './index.css'
import { ICONS } from '../../utils/icons'

const ico = {
  marginRight: '8px',
  marginBottom: '2px',
}

const userIco = {
  fontSize: '1.2em',
  marginRight: '6px',
  marginBottom: '2px',
}


export default class Header extends React.Component {
  state = {
    anchorEl: null
  }

  handleMenu = event => {
    this.setState({ anchorEl: event.currentTarget })
  }

  handleClose = event => {
    this.setState({ anchorEl: null })
  }

  handleLogout() {
    this.handleClose()
    this.props.onLogout()
  }

  render() {
    const auth = this.props.auth
    const { anchorEl } = this.state
    const open = Boolean(anchorEl);

    return (
      <>
        <header>
          {auth.loggedIn && (
            <>
              <div className="structural-unit">{auth.structuralUnit}</div>
              <div className="app-menu">
                <Button
                  aria-owns={open ? 'menu-appbar' : null}
                  aria-haspopup="true"
                  aria-label={auth.user}
                  onClick={this.handleMenu}
                  color="inherit"
                  className="app-menu-btn"
                >
                  <i className={ICONS.user} style={userIco}></i>
                  <span className="user-name">{auth.user}</span>
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
                  onClose={this.handleClose}
                >
                  <MenuItem disabled>
                    <i className={ICONS.user} style={userIco}></i>
                    {auth.user}
                  </MenuItem>
                  <a href="/admin/" target="_blank" rel="noreferrer noopener">
                    <MenuItem>
                      <i className={ICONS.admin} style={ico}></i>
                      Адмін панель
                  </MenuItem>
                  </a>
                  <Divider />
                  <MenuItem onClick={this.handleLogout.bind(this)}>
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
}
