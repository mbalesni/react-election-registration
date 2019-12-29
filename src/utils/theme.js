import blue from '@material-ui/core/colors/blue';
import { createMuiTheme } from '@material-ui/core/styles';

const BASE_TEXT_COLOR = 'rgba(0,0,0,.6)'

export const THEME = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  palette: {
    primary: {
      light: blue[300],
      main: blue[500],
      dark: blue[700],
      contrastText: '#fff',
    },
    secondary: {
      main: '#9E2F2E',
      contrastText: '#fff'
    }
  },
  overrides: {
    MuiButton: { 
      label: { 
        textTransform: 'none',
      },
      root: {
        color: BASE_TEXT_COLOR,
        borderRadius: '24px',
        fontSize: '.95rem',
      }
    },
    MuiDialog: {
      paper: {
        margin: 0,
      }
    },
    MuiDialogContent: {
      root: {
        paddingBottom: 0
      }
    },
    MuiPaper: {
      rounded: {
        borderRadius: '12px'
      }
    },
    MuiMenuItem: {
      root: {
        color: BASE_TEXT_COLOR,
      }
    },
    MuiTypography: {
      body2: {
        color: BASE_TEXT_COLOR
      }
    },
    MuiTab: {
      root: {
        textTransform: 'none',
        minWidth: '0 !important',
        width: '33.33%',
      },
      labelContainer: {
        padding: '6px 0 !important',
      }
    }
  },

})
