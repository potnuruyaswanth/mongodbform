const express=require('express');
const bcrypt=require('bcrypt');
const bodyParser=require('body-parser');
const cors=require('cors');
const mysql=require('mysql2');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const rateLimit=require('express-rate-limit');
const app=express();
const JWT_Token_Secret="bhgd#W%&^%FVYTF^%R*VU^%FVUI^%8yup9buyubywegf6ff^%$E^%^*%R*^";

app.use(cors({origin:'*'}));
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please wait 15 minutes before trying again'
  },
  skipSuccessfulRequests: true, // Do not count successful logins
  standardHeaders: true,
  legacyHeaders: false
});



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

app.post('/login', authLimiter,(req,res)=>{
    console.log("request rate limit : ",req.rateLimit);
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
            // res.send({isPasswordValid:true});
            const jwt_token=jwt.sign(req.body,JWT_Token_Secret,{expiresIn:'1h'});
            res.send({message:"Login successfully",result:result,token:jwt_token,});
        }else{
            res.status(401).send('Incorrect password');
        }
    })
})

app.get('/')
app.listen(3000,()=>{
    console.log('Server is running on port 3000');
})