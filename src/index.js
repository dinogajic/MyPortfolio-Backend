import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";

const app = express();
app.use(cors())
app.use(express.json())
const port = 3000;
const { MongoClient } = require("mongodb");
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
      let doc = await database.collection("user").find().toArray()

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

--
 */


app.post("/register", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  await client.connect()
  let database = client.db('myportfolio'); 
  console.log(lastName);
  console.log(lastName);
  const pword = await bcrypt.hash(password, 10);
  console.log(pword);
  
  try {
    await database.collection("user").createIndex({email: 1}, {unique: true})

    const response = await database.collection("user").insertOne({
      email: email,
      password: pword,
      firstName: firstName,
      lastName: lastName,
    });

    console.log(response);

    console.log("User created successfully: " + response);
    res.json("User created successfully: " + response);
  } catch (error) {
    if (error.code == 11000) { // it could be .status, .code etc.. not sure
      return res.json({ status: "error", msg: "User already exist." });
    }
    return res.json({ status: "error" });
  }
});
}
run().catch(console.dir);


