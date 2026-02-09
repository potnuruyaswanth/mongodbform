const express=require('express');
const bcrypt=require('bcrypt');
const bodyParser=require('body-parser');
const cors=require('cors');
const mysql=require('mysql2');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const rateLimit=require('express-rate-limit');
require('dotenv').config();



const app=express();
app.use(express.static('frontend')); // Serve static files from frontend folder
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:5501', 'http://127.0.0.1:3000', 'http://localhost:5501'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Only 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please wait 5 minutes before trying again'
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

function generateAccessToken(user){
    return jwt.sign({id:user.id,username:user.username, role:user.role},process.env.JWT_Token_Secret,{expiresIn:'1m'});
}

function generateRefreshToken(user){
    return jwt.sign({id:user.id,username:user.username,role:user.role},process.env.REFRESH_SECRET,{expiresIn:"5m"});
}

function authenticate(req,res,next){
    const token = req.cookies.access_token;
    if(!token)return res.sendStatus(401);

    jwt.verify(token,process.env.JWT_Token_Secret,(err,user)=>{
        if (err) return res.sendStatus(401);
        req.user=user;
        next();
    });
}

function authorizeRole(role){
    return (req,res,next)=>{
        if (req.user.role!==role) return res.sendStatus(403);
        next();
    };
}


app.post('/register',async(req,res)=>{
    const {username,password}=req.body;
    const hashedpassword=await bcrypt.hash(password,10);
    
    db.query('INSERT INTO registration (username,hashedpassword) VALUES (?,?)',[username,hashedpassword],(err,result)=>{
        if(err){
            console.error('Error inserting user into database: ',err );
            res.status(500).send('Error registering user');
        }else{
            console.log('User registered successfully');
            res.status(201).json({ message: "User registered successfully" });
        }
    })
    
})

app.post('/login', authLimiter,async (req,res)=>{
    console.log("request rate limit : ",req.rateLimit);
    const {username,password}=req.body;
    db.query('SELECT id,username,role,hashedpassword FROM registration WHERE username=?',[username],async (err,result)=>{
        if (err) {
            console.error('Error fecting user from database: ',err);
            return res.status(500).send('Error logging in');
        }if(result.length===0){
            return res.status(400).send('Use not found');
        }
        const user=result[0];
        const isPasswordValid=await bcrypt.compare(password,user.hashedpassword);
        console.log(isPasswordValid);
        if (isPasswordValid) {
            const refresh_token=generateRefreshToken(user);
            const access_token=generateAccessToken(user)
            db.query('INSERT INTO refresh_tokens (user_id,token) VALUES (?,?)',[user.id,refresh_token],(err)=>{
                if (err) {
                    console.error("Error inserting refresh token into database :",err);
                    res.status(500).send('Fail to insert refresh token');
                }else{
                    console.log('Stored refresh token Successfully');
                    res.cookie("access_token",access_token,{
                        httpOnly:true,
                        sameSite:"strict",
                        maxAge:1*60*1000
                    }).cookie("refresh_token",refresh_token,{
                        httpOnly:true,
                        sameSite:"strict",
                        maxAge:5*60*1000
                    }).status(200).send({message:"Successfully login"});
                }
            });
        }else{
            res.status(401).send('Incorrect password');
        }
    })
})

app.post("/refresh", (req, res) => {
  const token = req.cookies.refresh_token;
  if (!token) return res.sendStatus(401);

  db.query(
    "SELECT * FROM refresh_tokens WHERE token=?",
    [token],
    (err, result) => {
        if(err)return res.sendStatus(500);
      if (result.length === 0) return res.sendStatus(403);

      jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        db.query("DELETE FROM refresh_tokens WHERE token=?",[token], (err) => {
          if(err) console.error("Error deleting old refresh token:", err);
        });
        
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        db.query(
          "INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)",
          [user.id, newRefreshToken],
          (err) => {
            if(err) console.error("Error inserting new refresh token:", err);
          }
        );

        res.cookie("access_token", newAccessToken, {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 1 * 60 * 1000
        }).cookie("refresh_token",newRefreshToken,{
            httpOnly:true,
            sameSite:"strict",
            maxAge:5*60*1000
        });

        res.json({ message: "refreshed" });
      });
    }
  );
});

app.post("/logout", (req, res) => {
  const token = req.cookies.refresh_token;
  if(!token)return res.sendStatus(204);
  db.query("DELETE FROM refresh_tokens WHERE token=?", [token]);

  res
    .clearCookie("access_token")
    .clearCookie("refresh_token")
    .json({ message: "logged out" });
});

/**
 * Example code : Example protected routes
 * below code
 */
app.get("/dashboard", authenticate, (req, res) => {
  res.json({
    message: "Welcome to dashboard",
    user: req.user
  });
});

app.get(
  "/admin",
  authenticate,
  authorizeRole("admin"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);
/**
 * Example end
 */


// app.get('/')
app.listen(3000,()=>{
    console.log('Server is running on port 3000');
})