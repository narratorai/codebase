// TODO: This value is copied from portal
// should we move all layout constants here?
const NAVBAR_HEIGHT = 66

// Breakpoints https://github.com/jxnblk/grid-styled#breakpoints
const breakpoints = {
  sm: '32em', // (512px)
  md: '48em', // (768px)
  tablet: '64em', // (1024px)
  lg: '75em', // (1200px)
}

const zIndex = {
  select: 999999,
  closeChatWidget: 999998,
  overlay: 99999,
  navbar: 1000,
}

// https://projects.invisionapp.com/share/8WEP8J5SM#/screens/270372538
const colors = {
  black: '#242424',
  white: '#ffffff',

  text: '#242424',
  background: '#ffffff',

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
}

// SPACING     0  1  2   3   4   5   6   7   8
const space = [0, 8, 16, 24, 32, 40, 48, 56, 64]

// FONT INDEXES    0   1   2   3   4   5   6   7   8   9
const fontSizes = [10, 11, 13, 14, 15, 18, 22, 26, 30, 42]

const typography = {
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
}

const fonts = {
  body:
    '"Source Sans Pro", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  heading:
    '"Source Sans Pro", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
}

module.exports = {
  zIndex,
  breakpoints: [breakpoints.sm, breakpoints.md, breakpoints.tablet, breakpoints.lg],
  colors,
  fonts,
  typography,
  fontSizes,
  fontWeights: {
    body: 400,
    heading: 700,
    normal: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  space,
  antdOverrides: {
    '@root-entry-name': "default",
    // Base colors
    '@primary-color': colors.blue500,
    '@normal-color': colors.gray400,
    '@white': colors.white,
    '@black': colors.black,
    // Colors
    '@blue-base': colors.blue500,
    '@purple-base': colors.purple500,
    '@cyan-base': colors.teal400,
    '@green-base': colors.green500,
    '@magenta-base': colors.magenta500,
    '@pink-base': colors.magenta500,
    '@red-base': colors.red600,
    '@orange-base': colors.orange500,
    '@yellow-base': colors.yellow400,
    '@volcano-base': colors.orange500,
    '@geekblue-base': colors.blurple500,
    '@lime-base': colors.lime500,
    '@gold-base': colors.yellow500,
    // layout
    '@layout-body-background': colors.gray200,
    '@layout-sider-background': colors.blue800,
    '@layout-sider-background-light': colors.gray200,
    '@layout-trigger-background': colors.blue900,
    '@layout-header-height': `${NAVBAR_HEIGHT}px`,
    '@layout-header-background': colors.blue900,
    '@layout-header-background-light': colors.white,
    // Font & Text
    '@font-family': fonts.body,
    '@text-color': colors.black,
    // Border Radius
    '@border-radius-base': '4px',
    // The background colors for active and hover states for things like
    // list items or table cells.
    '@item-hover-bg': colors.gray200,
    // Descriptions
    '@descriptions-bg': colors.gray100,
    // Progress
    '@progress-steps-item-bg': colors.gray200,
    // Menu
    '@menu-dark-bg': colors.blue800,
    '@menu-item-active-bg': colors.gray200,
    '@menu-dark-submenu-bg': colors.blue900,
    '@menu-dark-color': colors.gray100,
    '@menu-collapsed-width': '64px',
    '@menu-dark-item-active-bg': colors.gray200,
    '@menu-dark-highlight-color': colors.blue900,
    '@menu-dark-selected-item-icon-color': colors.blue800,
    '@menu-dark-selected-item-text-color': colors.blue800,
    '@menu-collapsed-width': '66px',
    '@menu-icon-size': '18px',
    '@menu-icon-size-lg': '18px',
    // Table
    '@table-body-sort-bg': colors.gray100,
    '@table-expanded-row-bg': colors.gray200,
    // Card
    '@card-skeleton-bg': colors.gray400,
    // Comment
    '@comment-author-time-color': colors.gray400,
    '@comment-action-hover-color': colors.gray700,
    // Avatar
    '@avatar-bg': colors.gray400,
    // PageHeader
    '@page-header-back-color': colors.black,
    // Slider
    '@slider-rail-background-color-hover': colors.gray300,
    // Skeleton
    '@skeleton-color': colors.gray200,
  },
}
