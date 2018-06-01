var Handlebars = require('Handlebars');
var template = $("#contatos-template").html();
var compiledTemplate = Handlebars.compile(template);

var usuario = {
    "nome" : "gerso",
    "chavePrivada": '123456',
    "contatos":[{
                "nome":"maria",
                "chavePrivada": 'abc123'
            },{
                "nome":"seu zé",
                "chavePrivada":'456abc'
            },{
                "nome" : "samara",
                "chavePrivada": "chobate"
            }]
}
$('#contatos-list').html(compiledTemplate(usuario));
