const express = require('express');
const bodyparse = require('body-parser');
const user = require('./database/models/user');
const pb = require('./database/models/pb');
const path = require('path');
const app = express();
app.use('/Images', express.static(path.join(__dirname, '/Images')))

const bcrypt = require('bcrypt');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "Images/")
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.ogirinalname + ".jpg")
    },
  })



const upload = multer({ storage })


app.use(bodyparse.urlencoded({extended: false}));
app.use(bodyparse.json());
app.use(session({
    secret:'keyboard cat',
    name: 'essecookie',
    proxy: true,
    resave: true,
    saveUninitialized: true
}))
const port = 8080;



app.use(cors());
app.use((req, res, next) => {
	//Qual site tem permissão de realizar a conexão, no exemplo abaixo está o "*" indicando que qualquer site pode fazer a conexão
    res.header("Access-Control-Allow-Origin", "*");
	//Quais são os métodos que a conexão pode realizar na API
    res.header("Access-Control-Allow-Methods", 'GET,PUT,POST,DELETE');
    app.use(cors());
    next();
});


app.get('/', (req, res) =>{
    res.send('Api do Curso');
})
app.get('/returnImg/:id', (req,res)=>{
    const id = req.params.id;
    user.findOne({where:{id:id}}).then(result =>{
        if(result != undefined){
            res.json(result);
        }else{

        }
    })
})
app.get('/posts/:id', (req,res)=>{
    const id = req.params.id;
    pb.findOne({where:{id:id}}).then(result =>{
        res.json(result)
    })
})
app.get('/postAll', (req,res)=>{
    pb.findAll().then(result =>{
        res.json(result)
    })
})




app.post('/uploadImg', upload.single('file'), (req, res)=>{
    const id = req.body.id;
    const senha = req.body.senha;
    user.findOne({where:{id:id}}).then(result =>{
    var verify = bcrypt.compareSync(senha,result.senha);
    if(verify){
        user.update({image: 'http://localhost:8080/Images/' + req.file.filename},{where:{id:id}})
        return res.json(1)
    }else{
        return res.json('Você não tem permissão para alterar')
    }
    })
    
})
app.post('/delete/:id/:pass/:email/:name', (req, res)=>{
    const id = req.params.id;
    const email = req.params.email;
    const senha = req.params.pass;
    const name = req.params.name;
    user.findOne({where:{email:email,name:name}}).then(result =>{
        if(result === null || result === undefined){
            return res.redirect('http://localhost:3000/forum');
        }else{
        var verify = bcrypt.compareSync(senha,result.senha);
        if(verify){
            pb.destroy({where:{
                 id:id}})
                res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
                return res.redirect('http://localhost:3000/forum');
        }
    }   
    })
       
})
app.post('/updateInformation', (req, res)=>{
    const id = req.body.id;
    const email = req.body.email;
    const name = req.body.name;
    const senha = req.body.senha;
    user.findOne({where:{id:id}}).then(result =>{
    var verify = bcrypt.compareSync(senha,result.senha);
    if(verify){
        user.update({email: email},{where:{id:id}})
        user.update({name: name},{where:{id:id}})
        return res.json(1)
    }else{
        return res.json('Você não tem permissão para alterar')
    }
    })
    
})

app.post('/create-post', upload.single('file'), (req, res) => {
    const titulo = req.body.titulo;
    const conteudo = req.body.conteudo;
    const username = req.body.username;
    if(req.file != undefined){
        pb.create({
            titulo:titulo,
            conteudo:conteudo,
            img:'http://localhost:8080/Images/' + req.file.filename,
            username:username,
        }).then(() =>{return res.json("Sucesso ao gravar")})
    }else{
        pb.create({
            titulo:titulo,
            conteudo:conteudo,
            username:username
        }).then(() =>{return res.json("Sucesso ao gravar")})
    }
    


})  


app.post('/register', function(req, res){
    const name = req.body.name;
    const email = req.body.email;
    const senha = req.body.senha;
    const image = req.body.image;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(senha, salt);
    user.findOne({where:{email:email}}).then(result =>{
        if(result != null){
            return res.json("Já existe esse email");
        }else{
            user.create({
                name: name,
                email: email,
                senha: hash,
                image: image
            }).then(() =>{return res.json("Sucesso ao gravar")})    
        }
    })
   
})
app.post('/login', (req,res)=>{
    const email = req.body.email;
    const senha = req.body.senha;

    user.findOne({where:{email:email}}).then(result =>{
        var verify = bcrypt.compareSync(senha,result.senha);
        if(verify){
            req.session.result = {
                id: result.id,
                name: result.name,
                email: result.email,
                image: result.image,
            

            }

            return res.send(req.session.result)
        }else{
            return res.json(1)
        }
    })
})



app.listen(port, () => {
    console.log('listen 8080');
})

