const ResizeSensor  = require( 'css-element-queries/src/ResizeSensor' );

const open_signup   = document.getElementById( 'open_signup' );
const close_signup  = document.getElementById( 'close_signup' );
const login_screen  = document.getElementById( 'login_screen' );
const login_panel   = document.getElementById( 'login_panel' );
const signup_panel  = document.getElementById( 'signup_panel' );
const panel_wrapper = document.getElementById( 'panel_wrapper' );

function openSignUpPanel( event ) {
  event.preventDefault();
  login_screen.classList.add( 'signup-panel-opened' );
  panel_wrapper.style.height = `${ signup_panel.offsetHeight }px`; 
}

function closeSignUpPanel( event ) {
  event.preventDefault();
  login_screen.classList.remove( 'signup-panel-opened' );
  panel_wrapper.style.height = `${ login_panel.offsetHeight }px`;
}

function bindHeightSize( target, element ) {
  new ResizeSensor( element, () => {
    target.style.height = `${ element.offsetHeight }px`; 
  } );
}

open_signup.addEventListener( 'click', openSignUpPanel );
close_signup.addEventListener( 'click', closeSignUpPanel );

document.addEventListener( 'DOMContentLoaded', () => {
  panel_wrapper.style.height = `${ login_panel.offsetHeight }px`;
  bindHeightSize( panel_wrapper, login_panel );
  bindHeightSize( panel_wrapper, signup_panel );
} );