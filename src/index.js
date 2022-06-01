import express from "express";

const app = express();
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
  try {
    app.get("/", async(req, res) => {
      await client.connect()
      let database = client.db('myportfolio'); 
      let cursor = await database.collection("user").find()
      let results = await cursor.toArray()

      console.log(results)    
      res.send(results);
  })
  } finally {
   
    await client.close();
  }
}
run().catch(console.dir);