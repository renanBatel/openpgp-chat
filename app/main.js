'use strict'
require( 'electron-reload' )( __dirname );
var fs = require('fs');
const {ipcMain} = require( 'electron' );

const electron    = require( 'electron' );
// const path        = require( 'path' );
// const url         = require( 'url' );
const app           = electron.app;
const BrowserWindow = electron.BrowserWindow;

var firebase = require('firebase');
var config = {
    apiKey: "AIzaSyDwU-AV5nC6m9IlXwkjtQ12BzXkfvNUpi0",
    authDomain: "openpgp-chat.firebaseapp.com",
    databaseURL: "https://openpgp-chat.firebaseio.com",
    projectId: "openpgp-chat",
    //storageBucket: "openpgp-chat.appspot.com",
    //messagingSenderId: "314141157485"
  };
var fire = firebase.initializeApp(config);
var auth = fire.auth();
var database = fire.database();
let mainWindow;


app.on('ready', () => {
  mainWindow = new BrowserWindow( {
    width:  1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#08587E',
    show: false
  } );
  mainWindow.setMenuBarVisibility( false );
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.once( 'ready-to-show', () => {
    mainWindow.show();
  } );


  // mainWindow.loadURL( url.format( {
  //   pathname: path.join( __dirname, 'index.html' ),
  //   protocol: 'file',
  //   slashes:  true
  // } ) );
} );

app.on('window-all-closed', () =>{
  app.quit();
})
ipcMain.on('abrir-home', () =>{
  mainWindow.loadURL(`file://${__dirname}/home.html`);
})
ipcMain.on('logout', ()=>{
  mainWindow.loadURL(`file://${__dirname}/index.html`)
})
