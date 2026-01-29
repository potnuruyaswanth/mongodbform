const express=require('express');
const bcrypt=require('bcrypt');
const bodyParser=require('body-parser');
const cors=require('cors');
const mysql=require('mysql2');
const app=express();

app.use(cors({origin:'*'}));
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));

const db=mysql.createPool({
    host:'localhost',
    user:'root',
    password:'password',
    database:'testdb',
    port:3306,
    connectionLimit:10,
});

db.getConnection((err,connection)=>{
    if(err){
        console.error('Error connecting to database: ',err);
        console.log(err.message);
        return;
    }console.log('Connected to database');
})

app.get('/',(req,res)=>{
    res.send('Hello World!');
})

app.post('/register',async(req,res)=>{
    const {username,password}=req.body;
    const hashedpassword=await bcrypt.hash(password,10);
    const decodehashpassword=await bcrypt.hash(hashedpassword,10);
    res.send({
        entered_usernane:username,
        entered_password:password,
        hashedpassword:hashedpassword,
        decodedpassword:decodehashpassword,
    })
})

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
})