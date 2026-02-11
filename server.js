import express from 'express'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import * as url from 'url';
import bcrypt from 'bcryptjs';
import * as jwtJsDecode from 'jwt-js-decode';
import base64url from "base64url";
import * as SimpleWebAuthnServer from '@simplewebauthn/server';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const app = express()
app.use(express.json())

const adapter = new JSONFile(__dirname + '/auth.json');
const db = new Low(adapter);
await db.read();
db.data ||= { users: [] }

const rpID = "localhost";
const protocol = "http";
const port = 5050;
const expectedOrigin = `${protocol}://${rpID}:${port}`;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

function findUser(email) {
  const results = db.data.users.filter(u=>u.email==email);
  if(results.lenght==0) return undefined;
  return results[0];
}
app.post("/auth/login", (req, res)=> {
  const userFound = findUser(req.body.email);
if(userFound){
  if(bcrypt.compareSync(req.body.password, userFound.password)){
    res.send({ok:true, name:userFound.name, email:userFound.email});
  }
  else{
      res.send({ok:false, message:"Credentials are wrong"});
  }
}
else{
  res.send({ok:false, message: "credentials are wrong"});
}
});

// ADD HERE THE REST OF THE ENDPOINTS
app.post("/auth/register", (req, res)=> {
    const salt = bcrypt.genSaltSync(10);
    const hashedPass = bcrypt.hashSync(req.body.password, salt);

  //TODO: Data validation
  const user = {
    name:req.body.name,
    email:req.body.email,
    password:hashedPass
  }
  const userFound = findUser(user.email);
  if(userFound){
    res.send({ok: false, message:"User already exists"});
  }
  else{ 
  db.data.users.push(user);
  db.write();
  }
});


app.get("*", (req, res) => {
    res.sendFile(__dirname + "public/index.html"); 
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});

