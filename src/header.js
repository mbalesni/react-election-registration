import React from 'react';
import Button from '@material-ui/core/Button';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Divider from '@material-ui/core/Divider';
import './css/header.css'
import logo from './img/logo.jpg'




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

  render () {
    const auth = this.props.auth
    const { anchorEl } = this.state
    const open = Boolean(anchorEl);
    const {baseUrl} = this.props

    return (
      <header>
        <div className="logo">
          <img src={logo} alt="logo" height="45" />
          <div className="title">ЦВК Студентів КНУ</div>
        </div>
        {auth.loggedIn && (
                <div className="app-menu">

                  <Button
                    variant="flat"
                    aria-owns={open ? 'menu-appbar' : null}
                    aria-haspopup="true"
                    aria-label={auth.user}
                    onClick={this.handleMenu}
                    color="inherit"
                    className="app-menu-btn"
                  >
                    <AccountCircle style={{marginRight: 8}}/>
                    <span style={{position: 'relative', top: 1}}>{auth.user}</span>
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
                    <a href={baseUrl + '/admin/'} target="_blank" rel="noopener noreferrer">
                      <MenuItem onClick={this.handleClose}>Адмін панель</MenuItem>
                    </a>
                    <a href={baseUrl + '/admin/logout'}>
                      <MenuItem onClick={this.handleClose}>Вийти</MenuItem>
                    </a>
                  </Menu>
                </div>
              )}
      </header>
    )
  }
}
