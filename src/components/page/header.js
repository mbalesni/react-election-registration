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
    window.location = this.props.baseUrl + '/admin/logout'
  }

  render() {
    const auth = this.props.auth
    const { anchorEl } = this.state
    const open = Boolean(anchorEl);

    return (
      <header>
        <div className="logo">
          <img src={logo} alt="logo" height="45" />
          <div className="title">ЦВК студентів КНУ</div>
        </div>
        {auth.loggedIn && (
          <div className="app-menu">
              <AccountCircle style={{ marginRight: 8 }} />
              <span style={{ position: 'relative', top: 1 }}>{auth.user}</span>
          </div>
        )}
      </header>
    )
  }
}
