import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import bcryptjs from "bcryptjs"
import { MongoClient } from "mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"


//EXPRESS AND CORS

const app = express();
app.use(cors())
app.use(express.json())
const port = 3000;
app.listen(process.env.PORT || port)

//MONGODB

const uri = process.env.MONGODB_URL;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


//MONGOOSE

import mongoose from "mongoose"
import multer from "multer"
import fs from "fs"


mongoose
  .connect(
    process.env.MONGOOSE_URL, {
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads");
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });



async function run() {


//IMAGES GET/POST PROFILE 


app.post("/profile_image", [verify], upload.single("image"),  async (req, res) => {
  await client.connect()
  let database = client.db('myportfolio'); 
  await database.collection("profile_images").deleteOne({"userEmail": req.jwt.email});

  const response = await database.collection("profile_images").insertOne({
    name: req.body.name,
    userEmail: req.jwt.email,
    img: {
      data: fs.readFileSync("uploads/" + req.file.filename),
      contentType: "image/png",
    },
 })
  res.json(response)
});

app.get('/profile_image', [verify], async (req,res)=>{
  await client.connect()
  let database = client.db('myportfolio');

  let profile_image = await database.collection("profile_images").findOne({userEmail: req.jwt.email})

  res.json(profile_image)
})


//REGISTRATION


app.post("/register", async (req, res) => {
    let data = req.body;
    await client.connect()
    let database = client.db('myportfolio'); 

    const response = await database.collection("profile_images").insertOne({
      name: "default profile picture",
      userEmail: data.email,
      img: {
        data: fs.readFileSync("uploads/profile_pic.png"),
        contentType: "image/png",
      },
   })
   
    try {
      await database.collection("user").createIndex({email: 1}, {unique: true})
  
      const response = await database.collection("user").insertOne({
        email: data.email,
        password: await bcryptjs.hash(data.password, 8),
        firstName: data.firstName,
        lastName: data.lastName,
        userData: {
          country: data.country,
          mobile_number: data.mobile_number,
          address: data.address,
          postcode: data.postcode,
          education: data.education,
        }
      });
  
      console.log("User created successfully");
      res.json("User created successfully");
    } catch (error) {
      if (error.code == 11000) {
        return res.json({ status: "error", msg: "User already exist." });
      }
      return res.json({ status: "error" });
    }
  });


//AUTHENTICATION


app.post("/auth", async (req, res) => {
    let data = req.body
    await client.connect()
    let database = client.db('myportfolio')
  
    let user = await database.collection("user").findOne({email: data.email})
  
    if(user && user.password && (await bcryptjs.compare(data.password, user.password))) {
      delete user.password
      let token = jwt.sign(user, process.env.JWT_KEY, {
        algorithm: "HS512",
        expiresIn: "1 day"
      })
       res.json({
        token,
        email: user.email,
        id: user._id
      })
      return true
    }
    else {
      res.status(401).send({ status: "Auth error", msg: "Cannot authenticate" })
      return false
    }
  })
  
  
  
app.get("/authsec", [verify], (req, res) => {
  
    res.json({ message: "Korisnik: " + req.jwt._id})
  
    })


//USER


app.get("/user", [verify], async(req, res) => {
    await client.connect()
    let database = client.db('myportfolio');
    
    let doc = await database.collection("user").findOne({email: req.jwt.email})

      res.json(doc);
  })
  
app.patch("/user/:id", [verify], async (req, res) => {
    let data = req.body;
    let id = req.params.id
    await client.connect()
    let database = client.db('myportfolio'); 
    const response = await database.collection("user").updateOne({_id: ObjectId(id)}, { $set: data });
    console.log(response.modifiedCount)
    res.json(response)
    });


//PORTFOLIO


app.get("/portfolio", [verify], async(req, res) => {
    await client.connect()
    let database = client.db('myportfolio');
    
    let doc = await database.collection("portfolio").find({userEmail: req.jwt.email}).toArray()

    res.json(doc);
  })

app.post("/portfolio", [verify], upload.array("images", 5), async (req, res) => {
  let data = req.body;
  await client.connect()
  let database = client.db('myportfolio'); 
  
  let imgArray = []
  req.files.map((file) => {
    imgArray.push({
        data: fs.readFileSync("uploads/" + file.filename),
        contentType: "image/png",
    })
  })
  
  try {
    const response = await database.collection("portfolio").insertOne({
      projectTitle: data.projectTitle,
      projectSubtitle: data.projectSubtitle,
      projectDescription: data.projectDescription,
      projectLinks: data.projectLinks,
      userEmail: req.jwt.email,
      template: data.templateChoice,
      imagesArray: imgArray
    });

    console.log(response)

    console.log("Portfolio created successfully");
    res.json("Portfolio created successfully");
  } catch (error) {
  }
});

app.patch("/portfolio/:id", [verify], upload.array("images", 5), async (req, res) => {
  let data = req.body;
  let id = req.params.id
  await client.connect()
  let database = client.db('myportfolio'); 

  let imgArray = []
  req.files.map((file) => {
    imgArray.push({
        data: fs.readFileSync("uploads/" + file.filename),
        contentType: "image/png",
    })
  })

  const response = await database.collection("portfolio").updateOne({_id: ObjectId(id)}, { 
    $set: {
      projectTitle: data.projectTitle,
      projectSubtitle: data.projectSubtitle,
      projectDescription: data.projectDescription,
      projectLinks: data.projectLinks,
      userEmail: req.jwt.email,
      template: data.templateChoice,
      imagesArray: imgArray
    } });
  console.log(response.modifiedCount)
  res.json(response)
  });
 
app.delete("/portfolio/:id", [verify], async (req, res) => {
    let id = req.params.id
    await client.connect()
    let database = client.db('myportfolio'); 
    const response = await database.collection("portfolio").deleteOne({_id: ObjectId(id)});
    res.json("Portfolio deleted")
    });

//FUNCTIONS


function verify(req, res, next) {
  try {
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
      next()
    }
    }
    catch(error) {
      res.status(403).send()
      return false
    }
}

}
run().catch(console.dir);


