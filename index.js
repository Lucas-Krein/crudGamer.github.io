console.log("Seja Bem-vindo, Lucas!")
const mysql = require('mysql2')
const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

const app = express();
app.use('/uploads', express.static('uploads'));


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'cadastro_perfil'
});

connection.connect(function (err) {
    if (err) {
        console.error('Erro: ', err)
        return
    }
    console.log("Conexão estabelecida com sucesso!")
});

app.get("/formulario", function (req, res) {
    res.sendFile(__dirname + "/formulario.html")

});


app.post('/adicionar',upload.single('imagem_path'), (req, res) => {

    if(!req.file){
        console.log("Nenhum arquivo enviado")
        req.status(400).send("Nenhum arquivo Enviado.")
        return;
    }
    const usuario = req.body.usuario;
    const senha = req.body.senha;
    const nick = req.body.nick;
    const bio = req.body.bio;
    const cidade = req.body.cidade;
    const estado = req.body.estado;
    const pais = req.body.pais;
    const imagem_path = req.file.filename

    const values = [usuario, senha, nick, bio, cidade, estado, pais, imagem_path]
    const insert = "INSERT INTO perfil(usuario, senha, nick, bio, cidade, estado, pais, imagem_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"

    connection.query(insert, values, function (err, result) {
        if (!err) {
            console.log("Dados inseridos com sucesso!")
            res.redirect(`/listar`)
        } else {
            console.log("Não foi possível inserir os dados: ", err);
            res.send("Erro!")
        }
    })
});


app.use(express.static('public'));


app.get('/listar', function (req, res) {

    const selectAll = "SELECT usuario, senha, nick, bio, cidade, estado, pais, imagem_path, cod_jogador FROM perfil";

    connection.query(selectAll, function (err, rows) {
        if (!err) {
            console.log("Dados inseridos com sucesso!");
            res.send(`
            <html>
                 <head>
                    <title> Perfil </title>
                    <link rel="stylesheet" type="text/css" href="/estilo.css">
                    <link rel="icon" type="image/x-icon" href="download.png">
                 </head>
                 <body class="fundoperfil">
                 <div class="bodyfil">
                        ${rows.map(row => `
                        <p class="fotoperfil">
                           <img src= "/uploads/${row.imagem_path}" alt="Imagem de Perfil" style="widht:1000px; height:200px;">
                           </p>

                           <h1><p class="nick">
                           ${row.nick}
                           </p></h1>
                           
                           <p class="usuario">
                            ${row.usuario}
                            </p>

                            <p class="cidade">
                            ${row.cidade}
                            |
                            ${row.estado}
                            |
                            ${row.pais}
                            </p>

                           <p class="bio">
                            ${row.bio}
                           </p>
                           
                            <p class="atualetar">
                            <a href = "/deletar/${row.cod_jogador}"> Deletar </a>
                            <a href = "/atualizar-form/${row.cod_jogador}"> Atualizar </a>
                            </p>
                        `).join('')}
                </div>
                 </body>
            </html>
         `);
        } else {
            console.log("Erro ao listar os dados! ", err);
            res.send("Erro!")
        }
    })
});
app.get("/", function (req, res) {
    res.send(`
    <html>
    <head>
        <link rel="icon" type="image/x-icon" href="download.png">    
        <title> Salão Principal </title>
        <link rel="stylesheet" type="text/css" href="/estilo.css">
    </head>
    <body class="fundo">
       <div>
            <h1><p>
                <a href="/listar">Perfil</a href>
                <a href="/formulario">Cadastrar Perfil</a href>
            </p></h1>
       </div>
    </body>
    </html>
    `)
});
app.get("/deletar/:cod_jogador", function (req, res) {
    const codigoDoJogador = req.params.cod_jogador;

    const deleteJogador = "DELETE FROM perfil WHERE cod_jogador = ?";

    connection.query(deleteJogador, [codigoDoJogador], function (err, result) {
        if (!err) {
            console.log("Perfil deletado!");
            res.redirect('/formulario');
        } else {
            console.log("Erro ao deletar o perfil: ", err);
        }
    })
});



app.get("/atualizar-form/:cod_jogador", function (req, res) {
    const codigoDoJogador = req.params.cod_jogador;

    const selectJogador = "SELECT * FROM perfil WHERE cod_jogador = ?";

    connection.query(selectJogador, [codigoDoJogador], function (err, result) {
        if (!err && result.length > 0) {
            const perfil = result[0];

            res.send(`
            <html>
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">    
            <title>Editar</title>
                <link rel="stylesheet" type="text/css" href="/estilo.css">
            </head>
            <body class="fundoditar">
                <div class="cabecalhoeditar">
                    <h1><p>
                        <a href="/listar">Perfil</a href>
                        <a href="/"> Home</a href>   
                    </p></h1>
                </div>
                
                <h2><div class="editar">
                <form action="/atualizar/${codigoDoJogador}" method = "POST" enctype="multipart/form-data">
                    <h1>Editar Perfil</h1>
                    <label for="nick">Nick:<br></label>
                    <input type="text" id="nick" name="nick" value="${perfil.nick}" placeholder="Seu nick..." required><br>
                    <br>
                    <label for="usuario">E-Mail:<br></label>
                    <input type="email" id="usuario" name="usuario" value="${perfil.usuario}" placeholder="Seu email..." required><br>
                    <br>
                    <label for="senha">Senha:<br></label>
                    <input type="password" id="senha" name="senha" value="${perfil.senha}" placeholder="Sua senha..." required><br>
                    <br>
                    <label for="cidade">Cidade:<br></label>
                    <input type="text" id="cidade" name="cidade" value="${perfil.cidade}" placeholder="Sua cidade..." required><br>
                    <br>
                    <label for="estado">Estado:<br></label>
                    <input type="text" id="estado" name="estado" value="${perfil.estado}" placeholder="Seu estado..." required><br>
                    <br>
                    <label for="pais">País:<br></label>
                    <input type="text" id="pais" name="pais" value="${perfil.pais}" placeholder="Seu país..." required><br>
                    <br>
                    <label for="bio">Deixe aqui sua mensagem ao mundo:<br></label>
                    <textarea name="bio" id="bio" value="${perfil.bio}" placeholder="Mensagem..." required></textarea><br>
                    <br>
                    <label for="imagem_path">Insira sua nova imagem de perfil:</label>
                    <input type="file" id="imagem_path" name="imagem_path" value="${perfil.imagem_path}" accept="image/*"><br>
                    <br>
                    <input type="submit" value="Editar">
                    </form>
                </div></h2>
            </body>
            </html>
            `);
        } else {
            console.log("Erro ao obter dados do perfil: ", err);
        }
    });
});
app.post('/atualizar/:cod_jogador', upload.single('imagem_path'), (req, res) => {
    const cod_jogador = req.params.cod_jogador;
    const usuario = req.body.usuario;
    const senha = req.body.senha;
    const nick = req.body.nick;
    const bio = req.body.bio;
    const cidade = req.body.cidade;
    const estado = req.body.estado;
    const pais = req.body.pais;
    const imagem_path = req.file.filename

    const updateQuery = "UPDATE perfil SET usuario=?, senha=?, nick=?, bio=?, cidade=?, estado=?, pais=?, imagem_path=? WHERE cod_jogador=?";

    connection.query(updateQuery, [usuario, senha, nick, bio, cidade, estado, pais, imagem_path, cod_jogador], function (err, result) {
        if (!err) {
            console.log("Perfil atualizado!");
            res.redirect(`/listar`);
        } else {
            console.log("Erro ao atualizar o perfil: ", err);
        }
    })
});

app.listen(8089, function () {
    console.log("Servidor rodando na url http://localhost:8089")
});