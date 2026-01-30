const express=require('express');
const bcrypt=require('bcrypt');
const bodyParser=require('body-parser');
const cors=require('cors');
const mysql=require('mysql2');
const jwt=require('jsonwebtoken');
const app=express();

app.use(cors({origin:'*'}));
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));

const db=mysql.createPool({
    host:'localhost',
    user:'root',
    // password:'password',
    database:'student',
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
    
    db.query('INSERT INTO registration (username,hashedpassword) VALUES (?,?)',[username,hashedpassword],(err,result)=>{
        if(err){
            console.error('Error inserting user into database: ',err );
            res.status(500).send('Error registering user');
        }else{
            console.log('User registered successfully');
        }
    })

    res.send({
        entered_usernane:username,
        entered_password:password,
        hashedpassword:hashedpassword,
    })
    
})

app.get('/login', (req,res)=>{
    const {username,password}=req.body;
    db.query('SELECT * FROM registration WHERE username=?',[username],async (err,result)=>{
        if (err) {
            console.error('Error fecting user from database: ',err);
            res.status(500).send('Error logging in');
            return;
        }if(result.length===0){
            res.status(400).send('Use not found');
            return;
        }
        const user=result[0];
        const isPasswordValid=await bcrypt.compare(password,user.hashedpassword);
        console.log(isPasswordValid);
        if (isPasswordValid) {
            res.send({isPasswordValid:true});
        }else{
            res.status(401).send('Incorrect password');
        }
    })
})

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
})