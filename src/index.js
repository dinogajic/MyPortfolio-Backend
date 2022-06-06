import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";

const app = express();
app.use(cors())
app.use(express.json())
const port = 3000;
const { MongoClient } = require("mongodb");
app.listen(port)

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
      let doc = await database.collection("user").find().toArray()

      res.json(doc);
  })
  
  app.post("/user", async(req, res) => {
    let data = req.body

    await client.connect()

    let database = client.db('myportfolio'); 

    await database.collection("user").createIndex({username: 1}, {unique: true})

    let register_doc = {
      username: data.username,
      password: await bcrypt.hash(data.password, 8)
    }

    try {
    let register = await database.collection("user").insertOne(register_doc)

    res.json(register)
  }  catch(e) {    
    if(e.code == 11000) {
    throw new Error("Korisnik već postoji!")
  }}
})
}
run().catch(console.dir);


