import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
import { createMuiTheme } from '@material-ui/core/styles';



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
      light: red[300],
      main: red[500],
      dark: red[700],
      contrastText: '#fff'
    }
  },
  overrides: {
    MuiButton: { // Name of the component ⚛️ / style sheet
      label: { // Name of the rule
        textTransform: 'none', // Some CSS
      },
      root: {
        fontSize: '.95rem'
      }
    },
  },

})
