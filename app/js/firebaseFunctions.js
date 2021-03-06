require('sweetalert');
const validation = require('./validation');
const helpers = require('./helpers');
const openpgp = require('./cryptografa');
const firebase = require('firebase');
const { ipcRenderer } = require('electron');
const config = {
    apiKey: "AIzaSyDwU-AV5nC6m9IlXwkjtQ12BzXkfvNUpi0",
    authDomain: "openpgp-chat.firebaseapp.com",
    databaseURL: "https://openpgp-chat.firebaseio.com",
    projectId: "openpgp-chat",
    storageBucket: "openpgp-chat.appspot.com",
    messagingSenderId: "314141157485"
};

firebase.initializeApp(config);
const database = firebase.database();

let chavePrivada = null;

const loginCounter = new helpers.Counter({
    max: 3,
    timeout: 60,
    message: 'Máximo de tentativas atingido. Tente novamente em {result} segundos',
    elem: document.getElementById('login_error')
});



function validaSignup() {

    var email = document.getElementById('signup_email');
    var senha = document.getElementById('signup_senha');
    var nome = document.getElementById('signup_nome');
    var verificaPath = true;

    if (validation.validateSignup()) {

        const signup_form = document.getElementById('signup_form');

        signup_form.classList.add('loading');
        openpgp.geraChave(nome.value, email.value);

        const login_screen = document.getElementById('login_screen');
        const login_panel = document.getElementById('login_panel');
        const panel_wrapper = document.getElementById('panel_wrapper');
        const private_key = document.createElement('span');
        private_key.className = 'private-key-modal';
        private_key.innerText = 'Clique aqui para selecionar onde guardar sua chave';
        signup_form.classList.remove('loading');

        private_key.addEventListener('click', (e) => {
            e.preventDefault();
            verificaPath = openpgp.salvaChave();
            setTimeout(() => {
                if (verificaPath) {
                    firebase.auth().createUserWithEmailAndPassword(email.value, senha.value).then(res => {
                        let public = openpgp.getChavePublica();
                        salvaUsu(nome.value, email.value, res.uid, public);
                        nome.value = '';
                        email.value = '';
                        senha.value = '';

                        swal({
                            title: 'Usuario criado com sucesso',
                            text: 'Você já pode começar a mandar mensagens ;D',
                            icon: 'success',
                            buttons: 'Começar',
                        }).then((value) => {
                            setTimeout(() => {
                                login_screen.classList.remove('signup-panel-opened');
                                panel_wrapper.style.height = `${login_panel.offsetHeight}px`;
                            }, 200);
                        });

                    }).catch(function (error) {
                        if (error != null) {

                            signup_form.classList.remove('loading');
                            email.value = '';
                            senha.value = '';
                            email.classList.remove('active', 'success', 'error');
                            senha.classList.remove('active', 'success', 'error');
                            document.querySelector('label[for="signup_email"]').classList.remove('active');
                            document.querySelector('label[for="signup_senha"]').classList.remove('active');

                            swal({
                                title: 'Oops, temos um problema',
                                text: 'Este email já está cadastrado em nossa base de dados',
                                icon: 'error'
                            });

                            return;
                        }
                    });
                } else {
                    swal({
                        title: 'Oops!',
                        text: 'Selecione um caminho valido ou o usuario não será criado',
                        icon: 'error',
                        buttons: 'Ok',
                        content: private_key
                    });
                }
            }, 400);

        })
        nome.classList.remove('success');
        email.classList.remove('success');
        senha.classList.remove('success');

        swal({
            title: 'Só mais um passo',
            text: 'Você precisa salvar sua chave privada para começar a usar',
            icon: 'info',
            closeOnEsc: false,
            closeOnClickOutside: false,
            content: private_key,
            buttons: {
                cancel: {
                    text: 'Cancelar',
                    value: null,
                    visible: true
                },
                confirm: {
                    visible: false
                }
            }
        });
    }
}

function validaLogin() {

    var email = document.getElementById('email');
    var senha = document.getElementById('senha');

    const login_error = document.getElementById('login_error');
    login_error.innerText = '';

    if (validation.validateLogin() && loginCounter.isWaiting()) {
        let validaPath = false;
        const login_form = document.getElementById('login_form');

        login_form.classList.add('loading');

        firebase.auth().signInWithEmailAndPassword(email.value, senha.value).then(function () {
            ipcRenderer.send('abrir-home');
        }).catch(function (error) {
            if (error != null) {
                login_form.classList.remove('loading');
                login_error.innerText = 'Email ou senha invalídos';
                senha.value = '';
                email.classList.remove('success');
                senha.classList.remove('success', 'error');
                document.querySelector('label[for="senha"]').classList.remove('active');
                email.focus();
                loginCounter.count();
            }
        });
    }
}

function salvaUsu(nome, email, uid, public) {
    var usuRef = database.ref('usuarios/' + uid + '/informacoes');
    if (usuRef) {
        usuRef.push({
            name: nome,
            email: email,
            id: uid,
            chavePublica: public,
        });
    } else {
        console.log('ERRO ao referenciar usuario/informacao no bd salva usuario')
    }
}

function logOut() {
    firebase.auth().signOut();
    ipcRenderer.send('logout');
}
function setChavePrivada(chavepriv){
    chavePrivada = chavepriv;
}

function getChavePrivada( chavepriv ) {
    return chavePrivada;
}

function addContato(uid, email, callback, notification) {
    var usu = firebase.auth().currentUser;
    getAllUsuarios( (usuarios) => {
        var info = usuarios.map(r => r.informacoes);
        var usuRef = database.ref('usuarios/' + uid + '/contatos');
        var notifi = database.ref('notificacoes');
        var notFound = true;
        if(usuRef){
            info.forEach(i => {
                var obj = i[Object.keys(i)[0]];
                if (obj.email == email) {
                    notFound = false;
                   usuRef.push({
                        nome: obj.name, uid: obj.id, chavePublica: obj.chavePublica
                    });
                    if( notification ) {
                        notifi.push({ adicionado: obj.id, adicionando: uid, nomeAdicionando: usu.email});
                        Adicionado();
                    }
                    callback();
                }
            });
        }else{
            console.log('ERRO ao referenciar usuario/informacao no bd add contato')
        }
        if( notFound ) {
            swal( {
                icon: 'error',
                title: 'Oops!',
                text: 'Parece que este email ainda não foi cadastrado'
            } )
        }
    });
}

function Adicionado( callback ){
    firebase.auth().onAuthStateChanged((user) => {
        var contato = database.ref('notificacoes');
        var add = (data) => {
            var value = data.val();
            if(value){
                if(value.adicionado == user.uid){
                    swal( {
                        title: value.nomeAdicionando + ' quer te adicionar!',
                        text: 'Aceite a solicitção para adiciona-lo a seus contatos',
                        buttons: {
                            cancel: {
                                text: 'Recusar',
                                value: null,
                                closeModal: true,
                                visible: true
                            },
                            confirm: {
                                text: 'Aceitar',
                                value: true,
                                closeModal: true,
                                visible: true
                            }
                        }
                    } ).then( ( v ) => {
                        if( v )
                            addContato( user.uid, value.nomeAdicionando, callback, false );
                    } )
                var remove = database.ref('notificacoes/'+data.key);
                remove.remove();
            }
        }
    }
    if (contato) {
        contato.on('child_added', add);
    }
    });
}

function getAllUsuarios(callback) {
    var usuarios = database.ref('usuarios');
    var usuInfo = [];
    usuarios.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            usuInfo.push(childSnapshot.val());
        });
        callback(usuInfo);
    });
}

function getAllContatos(callback) {
    firebase.auth().onAuthStateChanged((user) => {
        var contatos = database.ref('usuarios/' + user.uid + '/contatos');
        var usuContato = [];
        contatos.once('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                usuContato.push(childSnapshot.val());
            });
            callback(usuContato);
        });
    })
}

function carregaMensagem(OutroUser, callback) {
    var user = firebase.auth().currentUser;
    var mensagem = database.ref('mensagens/');
    mensagem.off();
    var setMensagem = (data) => {
        const value = data.val();
        if ( value.uidEmitente == user.uid && value.uidDestinatario == OutroUser ) {
            openpgp.descifraMsg(chavePrivada, value.emtMessage, ( plainText ) => {
                callback( {
                    message: plainText.data,
                    date: '14:00'
                } );
            } );
        }
        else if( value.uidEmitente == OutroUser && value.uidDestinatario == user.uid ) {
            openpgp.descifraMsg( chavePrivada, value.destMessage, ( plainText ) => {
                callback( {
                    message: plainText.data,
                    date: '14:00',
                    from: OutroUser
                } );
            } );
        }
    }
    if (user) {
        mensagem.on('child_added', setMensagem); //lê as ultimas 10 mensagens
        mensagem.on('child_changed', setMensagem);//lê as ultimas 10 mensagens
    }
    // mensagem.once( 'value', ( snapshot ) => {
    //     snapshot.forEach( ( childSnapshot ) => {
    //         console.log( childSnapshot.val() );
    //     } )
    // } );
}

function enviarMensagem( destPubKey, emtPubKey, uidDestinatario, content, callback) {
    var user = firebase.auth().currentUser;
    openpgp.cifraMsg(destPubKey, chavePrivada, content, ( destCipherText ) => {
        openpgp.cifraMsg( emtPubKey, chavePrivada, content, ( emtCipherText ) => {
            if (user) {
                var mensagem = database.ref('mensagens/');
                mensagem.push( { 
                    uidEmitente    : user.uid,
                    uidDestinatario: uidDestinatario,
                    destMessage    : destCipherText.data,
                    emtMessage     : emtCipherText.data
                } ).then(
                    callback()
                );
            } else {
                console.log('USUARIO NÃO LOGADO')
            }
        } );
    } );
}

function getCurrentUser() {
    return firebase.auth().currentUser;
}

function setCurrentUserData( callback ) {

    getAllUsuarios( ( users ) => {

        const usersInfo = users.map( user => user.informacoes );

        usersInfo.forEach( info => {

            const object = info[ Object.keys( info ) [ 0 ] ];
            
            if( object.email == getCurrentUser().email ) {

                callback( object );
            }
        } );
    });
}

// Exports
module.exports = {
    validaSignup,
    getAllUsuarios,
    addContato,
    logOut,
    salvaUsu,
    validaLogin,
    validaSignup,
    carregaMensagem,
    enviarMensagem,
    getAllContatos,
    setChavePrivada,
    getCurrentUser,
    getChavePrivada,
    setCurrentUserData,
    Adicionado

}