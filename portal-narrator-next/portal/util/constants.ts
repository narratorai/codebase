// Breakpoints https://github.com/jxnblk/grid-styled#breakpoints
export const breakpoints = {
  sm: '32em', // (512px)
  md: '48em', // (768px)
  tablet: '64em', // (1024px)
  lg: '75em', // (1200px)
}

export const zIndex = {
  select: 999999,
  closeChatWidget: 999998,
  overlay: 1000,
  notification: 1000002,
}

type Color = {
  [key: string]: string
}

// https://projects.invisionapp.com/share/8WEP8J5SM#/screens/270372538
export const colors: Color = {
  white: '#ffffff',
  black: '#242424',

  // gray
  gray100: '#f9f9f9',
  gray200: '#f4f4f4',
  gray300: '#e5e5e5',
  gray400: '#cfd0d0',
  gray500: '#979899',
  gray600: '#666768',
  gray700: '#505152',
  gray800: '#333435',
  gray900: '#1d1d1e',

  // blue
  blue100: '#f1f7fb',
  blue200: '#dcedf8',
  blue300: '#99d0f3',
  blue400: '#58b3eb',
  blue500: '#298dcc',
  blue600: '#1d6c9e',
  blue700: '#0e4b71',
  blue800: '#001e3e',
  blue900: '#001021',

  // purple
  purple100: '#f6f1fe',
  purple200: '#e2d7f2',
  purple300: '#d0b7f5',
  purple400: '#a980e4',
  purple500: '#764cb2',
  purple600: '#513a73',
  purple700: '#382554',
  purple800: '#240f41',
  purple900: '#14022c',

  // red
  red100: '#feeeee',
  red200: '#f8c8c8',
  red300: '#ff9f9f',
  red400: '#f77374',
  red500: '#f04e4f',
  red600: '#be2728',
  red700: '#850d0e',
  red800: '#490101',
  red900: '#260000',

  // magenta
  magenta100: '#f9f2f6',
  magenta200: '#f6d6e8',
  magenta300: '#f3a6d2',
  magenta400: '#e480b9',
  magenta500: '#cd3c8e',
  magenta600: '#a71f6c',
  magenta700: '#790848',
  magenta800: '#51002e',
  magenta900: '#270016',

  // yellow
  yellow100: '#fdf6e5',
  yellow200: '#fcedc6',
  yellow300: '#ffdd8b',
  yellow400: '#ffd160',
  yellow500: '#ffb025',
  yellow600: '#d38c26',
  yellow700: '#a0550c',
  yellow800: '#472404',
  yellow900: '#221100',

  // orange
  orange100: '#fff4ec',
  orange200: '#f6d9c4',
  orange300: '#ffbd8c',
  orange400: '#ffa461',
  orange500: '#ff8125',
  orange600: '#ae5310',
  orange700: '#6f2f00',
  orange800: '#431f04',
  orange900: '#230f00',

  // green
  green100: '#ecfef4',
  green200: '#ccf2dc',
  green300: '#91f0b9',
  green400: '#52e18e',
  green500: '#20b05c',
  green600: '#117c3e',
  green700: '#065326',
  green800: '#003315',
  green900: '#001b0b',

  // teal
  teal100: '#eefbfa',
  teal200: '#d0f1ed',
  teal300: '#97eee2',
  teal400: '#50e3cf',
  teal500: '#1da290',
  teal600: '#0f7769',
  teal700: '#05584d',
  teal800: '#002d27',
  teal900: '#001815',

  // lime
  lime100: '#f6feef',
  lime200: '#bceb90',
  lime300: '#a4d972',
  lime400: '#8ac751',
  lime500: '#6bb328',
  lime600: '#437417',
  lime700: '#2f550d',
  lime800: '#1c3406',
  lime900: '#0f1e01',

  // blurple
  blurple100: '#f3f3ff',
  blurple200: '#c0bbfc',
  blurple300: '#9b94f3',
  blurple400: '#6f65f6',
  blurple500: '#5a4ef0',
  blurple600: '#2c2589',
  blurple700: '#201a67',
  blurple800: '#0d0a35',
  blurple900: '#080624',

  // V2 MAVIS AI COlORS
  mavis_black: '#0A0519',
  mavis_light_gray: '#F2F1F4',
  mavis_text_gray: '#9B9A9E',
  mavis_dark_gray: '#5A595C',
  mavis_darker_gray: '#E7E3EE',
  mavis_off_white: '#F7F7F7',
  mavis_checkout_blue: '#1586E8',
  mavis_subscribed_green: '#20CB49',
  mavis_light_purple: '#D759F7',
  mavis_dark_purple: '#6331B3',
}

export const PINK_HEART_COLOR = '#eb2f96'
export const PERCENT_OF_TOTAL_COLOR = '#353800'

export const NOT_IN_COHORT_COLOR = colors.blue500

// FONT INDEXES       //  0   1   2   3   4   5   6   7   8   9
export const fontSizes = [10, 11, 13, 14, 15, 18, 22, 26, 30, 42]

// FIXME - These lineHeights are deprecated, please use typography
export const lineHeights = [
  '14px', // 0 -- with 11px fontSize
  '16px', // 1 -- with 13px fontSize
  '20px', // 2 -- with 16px fontSize
  '24px', // 3 -- with 20px fontSize
  '30px', // 4 -- with 26px fontSize
  '46px', // 5 -- with 36px fontSize
]

export const lightWeight = 300
export const semiBoldWeight = 600

export const rebassTheme = {
  breakpoints: [breakpoints.sm, breakpoints.md, breakpoints.tablet, breakpoints.lg],
  colors,
  fonts: {
    sans: '"Source Sans Pro", sans-serif',
  },
  fontSizes,
  fontWeights: {
    normal: 400,
    semiBold: semiBoldWeight,
    bold: 700,
  },
  space: [0, 8, 16, 24, 32, 40, 48, 56, 64],
  zIndex,
}

export const MAX_WIDTHS = [360, 768, 1336, 1336, 1920]
export const MAX_WIDTH = 1366
export const PLOT_HEIGHT = 480
export const SIDENAV_WIDTH = 200
export const SIDENAV_WIDTH_COLLAPSED = 66
export const SIDEBAR_WIDTH = 240
export const MOBILE_TOPNAV_HEIGHT = 56
export const LAYOUT_SIDER_WIDTH = 360

export const STATUS_PAGE_BANNER_Z_INDEX = 99
export const DEFAULT_LOGIN_REDIRECT_PATH = '/datasets'
export const DEFAULT_LOGIN_REDIRECT_PATH_V2 = '/chat'
export const DEFAULT_MOBILE_LOGIN_REDIRECT_PATH = '/narratives'

export const typography = {
  // MARKDOWN
  // "heading" values taken from Chrome initial values
  heading1: {
    sizes: ['2em'],
    lineHeights: ['initial'],
    fontWeight: 'semiBold',
  },
  heading2: {
    sizes: ['1.5em'],
    lineHeights: ['initial'],
    fontWeight: 'semiBold',
  },
  heading3: {
    sizes: ['1.17em'],
    lineHeights: ['initial'],
    fontWeight: 'semiBold',
  },
  heading4: {
    sizes: ['initial'],
    lineHeights: ['initial'],
    fontWeight: 'semiBold',
  },

  // BODY
  body400: {
    sizes: [fontSizes[0]], // 10
    lineHeights: [1.2],
  },
  body300: {
    sizes: [fontSizes[1]], // 11
    lineHeights: [1.28],
  },
  body200: {
    sizes: [fontSizes[2]], // 13
    lineHeights: [1.24],
  },
  body100: {
    sizes: [fontSizes[3]], // 14
    lineHeights: [1.43],
  },
  body50: {
    sizes: [fontSizes[4]], // 15
    lineHeights: [1.52],
  },

  // TITLES
  title400: {
    sizes: [fontSizes[5]], // 18
    lineHeights: [1.34],
  },
  title300: {
    sizes: [fontSizes[6]], // 22
    lineHeights: [1.28],
  },
  title200: {
    sizes: [fontSizes[7]], // 26
    lineHeights: [1.24],
  },
  title100: {
    sizes: [fontSizes[8]], // 30
    lineHeights: [1.2],
  },
  title50: {
    sizes: [fontSizes[9]], // 42
    lineHeights: [1.2],
  },

  // FIXME - THESE STYLES ARE NOW deprecated AND SHOULD NO LONGER BE USED
  title3: {
    // 36
    sizes: [fontSizes[7]],
    // 46
    lineHeights: [lineHeights[5], lineHeights[5], lineHeights[5], lineHeights[5]],
    fontWeight: 'bold',
  },
  title2: {
    // 26
    sizes: [fontSizes[6]],
    // 30
    lineHeights: [lineHeights[4], lineHeights[4], lineHeights[4], lineHeights[4]],
    fontWeight: 'semiBold',
  },
  title1: {
    // 20
    sizes: [fontSizes[5]],
    // 24
    lineHeights: [lineHeights[3], lineHeights[3], lineHeights[3], lineHeights[3]],
    fontWeight: 'semiBold',
  },
  text2: {
    // 16
    sizes: [fontSizes[3]],
    // 20
    lineHeights: [lineHeights[2], lineHeights[2], lineHeights[2], lineHeights[2]],
  },
  text1: {
    // 13
    sizes: [fontSizes[2]],
    // 16
    lineHeights: [lineHeights[1], lineHeights[1], lineHeights[1], lineHeights[1]],
  },
  caption: {
    // 11
    sizes: [fontSizes[1]],
    // 14
    lineHeights: [lineHeights[0], lineHeights[0], lineHeights[0], lineHeights[0]],
  },
}

export const SECONDS_IN_MINUTE = 60
export const SECONDS_IN_HOUR = 3600
export const SECONDS_IN_DAY = 86400
export const MINUTES_IN_HOUR = 60
export const MINUTES_IN_DAY = 1440

export const FORM_DATA_CONTENT_TYPE = 'multipart/form-data'
