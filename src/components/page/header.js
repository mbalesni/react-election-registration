import React from 'react';
import Button from '@material-ui/core/Button';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Divider from '@material-ui/core/Divider';
import './header.css'
import logo from './cvk-logo.png'




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
    this.props.onCloseSessions()
    localStorage.removeItem('authToken')
    window.location = window.location + ''
  }

  render() {
    const auth = this.props.auth
    const { anchorEl } = this.state
    const open = Boolean(anchorEl);

    return (
      <header>
        <div className="logo">
          <img src={logo} alt="logo" height="45" />
          <div className="title">Реєстрація виборців</div>
        </div>
        {auth.loggedIn && (
          <div className="app-menu">
            <Button
              aria-owns={open ? 'menu-appbar' : null}
              aria-haspopup="true"
              aria-label={auth.user}
              onClick={this.handleMenu}
              color="inherit"
              className="app-menu-btn"
            >
              <AccountCircle style={{ marginRight: 8 }} />
              <span style={{ position: 'relative', top: 1 }}>{auth.user}</span>
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
              <MenuItem disabled>{auth.user}</MenuItem>
              <Divider />
              <MenuItem onClick={this.handleLogout.bind(this)}>Вийти</MenuItem>
            </Menu>

          </div>
        )}
      </header>
    )
  }
}
