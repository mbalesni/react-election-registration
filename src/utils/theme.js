import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
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
      // light: red[300],
      main: '#9E2F2E',
      // dark: red[700],
      contrastText: '#fff'
    }
  },
  overrides: {
    MuiButton: { // Name of the component ⚛️ / style sheet
      label: { // Name of the rule
        textTransform: 'none', // Some CSS
      },
      root: {
        color: BASE_TEXT_COLOR,
        borderRadius: '20px',
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
        // flexGrow: 1,
        width: '33.33%',
      },
      labelContainer: {
        padding: '6px 0 !important',
      }
    }
  },

})
