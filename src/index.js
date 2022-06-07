import express from "express";
import cors from "cors";
import bcryptjs from "bcryptjs";
import { MongoClient } from "mongodb"

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

  
/*   app.post("/user", async(req, res) => {
    let data = req.body
    await client.connect()
    let database = client.db('myportfolio'); 

  try {
    await database.collection("user").createIndex({username: 1}, {unique: true})

    let register_doc = {
      username: data.username,
      password: await bcrypt.hash(data.password, 8)
    }

    let register = await database.collection("user").insertOne(register_doc)

    res.json(register)
  }  catch(e) {    
    if(e.code == 11000) {
    return res.json("Korisnik već postoji!")
  }}
})

----
 */

app.post("/auth", async (req, res) => {
  let data = req.body
/*   console.log(data.email) */
  await client.connect()
  let database = client.db('myportfolio')

  let user = await database.collection("user").findOne({email: data.email})

  if(user && user.password && (await bcryptjs.compare(data.password, user.password))) {
    
  }
  else {
    return res.json({ status: "error", msg: "Cannot auth" });
  }

  res.json(data)
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
}
run().catch(console.dir);


