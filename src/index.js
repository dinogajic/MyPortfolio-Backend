import dotenv from "dotenv"
dotenv.config()

import express from "express";
import cors from "cors";
import bcryptjs from "bcryptjs";
import { MongoClient } from "mongodb"
import jwt from "jsonwebtoken"

const app = express();
app.use(cors())
app.use(express.json())
const port = 3000;
/* const { MongoClient } = require("mongodb"); */
app.listen(process.env.PORT || port)

const uri =
"mongodb+srv://myportfolio-wa:webappsprojekt@myportfolio.ieynb.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function run() {
  app.get("/user", async(req, res) => {
    await client.connect()
    let database = client.db('myportfolio');
    
    let doc = await database.collection("user").findOne()

      res.json(doc);
  })



app.post("/register", async (req, res) => {
  let data = req.body;
/*const { email, password, firstName, lastName } = req.body; */
  await client.connect()
  let database = client.db('myportfolio'); 
/*console.log(data.lastName);
  console.log(data.lastName);
  const pword = await bcryptjs.hash(data.password, 10);
  console.log(pword); */
  
  try {
    await database.collection("user").createIndex({email: 1}, {unique: true})

    const response = await database.collection("user").insertOne({
      email: data.email,
      password: await bcryptjs.hash(data.password, 8),
      firstName: data.firstName,
      lastName: data.lastName,
    });

    /* console.log(response); */

    console.log("User created successfully");
    res.json("User created successfully");
  } catch (error) {
    if (error.code == 11000) { // it could be .status, .code etc.. not sure
      return res.json({ status: "error", msg: "User already exist." });
    }
    return res.json({ status: "error" });
  }
});




app.post("/auth", async (req, res) => {
  let data = req.body
/*   console.log(data.email) */
  await client.connect()
  let database = client.db('myportfolio')

  let user = await database.collection("user").findOne({email: data.email})

  if(user && user.password && (await bcryptjs.compare(data.password, user.password))) {
    delete user.password
    let token = jwt.sign(user, process.env.JWT_KEY, {
      algorithm: "HS512",
      expiresIn: "1 day"
    })
    return res.json({
      token,
      email: user.email
    })
  }
  else {
    return res.json({ status: "error", msg: "Cannot auth" });
  }
})



app.get("/authsec", (req, res) => {

  try {
    /*   console.log(req.headers) */

    let authorization = req.headers.authorization.split(' ')
    let type = authorization[0]
    let token =  authorization[1]
  
    console.log(type, token)  
  
    if(type !== "Bearer") {
      res.status(401).send()
      return false
    }
    else {
      req.jwt = jwt.verify(token, process.env.JWT_KEY)
      res.json({ message: "Korisnik: " + req.jwt.email})
    }
    }
    catch(error) {
      res.status(403).send()
      return false
    }

  })

}
run().catch(console.dir);


