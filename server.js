const express=require('express');
const bcrypt=require('bcrypt');
const bodyParser=require('body-parser');
const cors=require('cors');
const app=express();

app.use(cors({origin:'*'}));
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',(req,res)=>{
    res.send('Hello World!');
})

app.post('/register',async(req,res)=>{
    const {username,password}=req.body;
    console.log(username,' & ',password);
    const hashedpassword=await bcrypt.hash(password,10);
    res.send({
        entered_usernane:username,
        entered_password:password,
        hashedpassword:hashedpassword,
    })
})

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
})