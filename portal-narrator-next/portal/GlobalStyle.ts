import { createGlobalStyle } from 'styled-components'
import { colors, rebassTheme } from 'util/constants'

export const GlobalStyle = createGlobalStyle`
  html {
    /* TODO: looks like logRocket has
    // some issues with smoothscrolling. So
    // gonna disable this for now until we
    // have a workaround */

    /* scroll-behavior: smooth; */
  }

  html, body {
    -webkit-font-smoothing: antialiased;
    font-family: ${rebassTheme.fonts.sans};
    background-size: cover;
    background-repeat: no-repeat;
    background-image: url("/static/img/contour-gray-lg.svg");
    background-color: ${rebassTheme.colors.gray200};
  }

  body {
    overscroll-behavior-y: none;
  }

  body.no-overscroll {
    /* 
      stops the 'scroll left will navigate back' behavior
      Note this currently doesn't work on Safari
      https://developer.chrome.com/blog/overscroll-behavior/ 
    */ 
    overscroll-behavior-x: none;
  }

  /* #root is from previous CRA app */
  #root: {
    height: 100%;
  }

  /* stylelint-disable-next-line selector-id-pattern */
  #__next {
    height: 100%;
  }

  /* on smaller screens, lets limit the
     width of #root so when we show the
     small screen notice (MobileNotSupported)
     it fits the screen nicely.
     Note: 40em => 16 (base font size) * 40 == 640px */
  @media screen and (width <= 40em) {
    /* #root is from previous CRA app */
    #root: {
      position: relative;
      max-width: 100vw;
    }

    /* stylelint-disable-next-line selector-id-pattern */
    #__next {
      position: relative;
      max-width: 100vw;
    }

  }

  a {
    color: ${colors.blue500};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    &:visited {
      color: ${colors.blue500};
    }
  }

  /* allow sidenav submenu items to be more visible */
  .sidenav-sub-menu-item {
    color: ${colors.gray200};

    &:hover {
      color: white !important;
    }
  }
    
  /* allow table filter content to be inline with select box */
  .antd5-table-filter-dropdown {
    .antd5-dropdown-menu-title-content {
      display: flex;
    }
  }

  /* react-ace brace ext/language_tools overrides! */
  /* stylelint-disable-next-line selector-class-pattern */
  .ace_editor.ace_autocomplete {
    width: 500px !important;
  }

  /* stylelint-disable-next-line selector-class-pattern */
  .codeMarker {
    background: ${colors.blurple200};
    position: absolute;
    z-index: 20;
  }

  details[open] summary ~ * {
    animation: fadeIn .25s ease-in-out;
    transform: translate3d(0, 0, 0);
  }

  details summary:focus {
    outline: none;
  }

  /* stylelint-disable-next-line keyframes-name-pattern */
  @keyframes fadeIn {
    0%    {
      opacity: 0;
      transform: translate3d(0, -10px, 0);
    }

    100%  {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
`
