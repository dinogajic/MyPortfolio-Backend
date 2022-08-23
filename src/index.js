import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bcryptjs from "bcryptjs";
import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

import nodemailer from "nodemailer";

//EXPRESS AND CORS

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;
app.listen(process.env.PORT || port);

//MONGODB

const uri = process.env.MONGODB_URL;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//MONGOOSE

import mongoose from "mongoose";
import multer from "multer";
import fs from "fs";

mongoose.connect(process.env.MONGOOSE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

//REGISTRATION

app.post("/register", async (req, res) => {
  let data = req.body;
  await client.connect();
  let database = client.db("myportfolio");

  try {
    await database
      .collection("user")
      .createIndex({ email: 1 }, { unique: true });

    if (
      data.email == null ||
      data.password == null ||
      data.firstName == null ||
      data.lastName == null
    ) {
      return res.json({
        status: "ERROR",
        msg: "Form contains invalid values.",
      });
    } else {
      const register_response = await database.collection("user").insertOne({
        email: data.email,
        password: await bcryptjs.hash(data.password, 8),
        firstName: data.firstName,
        lastName: data.lastName,
        userData: {
          country: data.country,
          mobile_number: data.mobile_number,
          address: data.address,
          postcode: data.postcode,
          education: [],
          workExperience: [],
        },
      });

      const profile_image_register = await database
        .collection("profile_images")
        .insertOne({
          name: "default profile picture",
          userEmail: data.email,
          img: {
            data: fs.readFileSync("uploads/profile_pic.png"),
            contentType: "image/png",
          },
        });

      return res.json({ msg: "Profile successfully created." });
    }
  } catch (error) {
    if (error.code == 11000) {
      return res.json({ status: "ERROR", msg: "User already exists." });
    }
    return res.json({ status: "ERROR" });
  }
});

//AUTHENTICATION

app.post("/auth", async (req, res) => {
  let data = req.body;
  await client.connect();
  let database = client.db("myportfolio");

  if (data.email == null || data.password == null) {
    return res.json({ status: "ERROR", msg: "Form contains invalid values." });
  } else {
    let user = await database.collection("user").findOne({ email: data.email });

    if (
      user &&
      user.password &&
      (await bcryptjs.compare(data.password, user.password))
    ) {
      delete user.password;
      let token = jwt.sign(user, process.env.JWT_KEY, {
        algorithm: "HS512",
        expiresIn: "1 day",
      });
      res.json({
        token,
        email: user.email,
        id: user._id,
      });
      return true;
    } else {
      res.status(401).send({
        status: "Auth error",
        msg: "Please provide a valid email address and password.",
      });
      return false;
    }
  }
});

//USER

app.get("/user", [verify], async (req, res) => {
  await client.connect();
  let database = client.db("myportfolio");

  let user_response = await database
    .collection("user")
    .findOne({ email: req.jwt.email });

  res.json(user_response);
});

app.patch("/user/:id", [verify], async (req, res) => {
  let data = req.body;
  let id = req.params.id;
  await client.connect();
  let database = client.db("myportfolio");

  try {
    const response = await database
      .collection("user")
      .updateOne({ _id: ObjectId(id) }, { $set: data });

    return res.json({ msg: "User information has successfully updated." });
  } catch (error) {
    return res.json({ status: "ERROR", msg: "Update error" });
  }
});

//IMAGES GET/POST PROFILE

app.post(
  "/profile_image",
  [verify],
  upload.single("image"),
  async (req, res) => {
    await client.connect();
    let database = client.db("myportfolio");

    await database
      .collection("profile_images")
      .deleteOne({ userEmail: req.jwt.email });

    const profile_image_response = await database
      .collection("profile_images")
      .insertOne({
        name: req.body.name,
        userEmail: req.jwt.email,
        img: {
          data: fs.readFileSync("uploads/" + req.file.filename),
          contentType: "image/png",
        },
      });
    return res.json({ msg: "Profile picture successfully updated." });
  }
);

app.get("/profile_image", [verify], async (req, res) => {
  await client.connect();
  let database = client.db("myportfolio");

  let profile_image = await database
    .collection("profile_images")
    .findOne({ userEmail: req.jwt.email });

  res.json(profile_image);
});

//PORTFOLIO

app.get("/portfolio", [verify], async (req, res) => {
  await client.connect();
  let database = client.db("myportfolio");

  let portfolio_respons = await database
    .collection("portfolio")
    .find({ userEmail: req.jwt.email })
    .toArray();

  res.json(portfolio_respons);
});

app.post(
  "/portfolio",
  [verify],
  upload.array("images", 10),
  async (req, res) => {
    let data = req.body;
    await client.connect();
    let database = client.db("myportfolio");

    let imgArray = [];
    req.files.map((file) => {
      imgArray.push({
        data: fs.readFileSync("uploads/" + file.filename),
        contentType: "image/png",
      });
    });

    try {
      if (data.templateChoice == 1) {
        const response = await database.collection("portfolio").insertOne({
          designPortfolioTitle: data.designPortfolioTitle,
          designPortfolioDescription: data.designPortfolioDescription,
          designPortfolioLinks: data.designPortfolioLinks,
          userEmail: req.jwt.email,
          template: data.templateChoice,
          imagesArray: imgArray,
        });

        return res.json({ msg: "Design portfolio created successfully." });
      } else if (data.templateChoice == 2) {
        const response = await database.collection("portfolio").insertOne({
          softwarePortfolioTitle: data.softwarePortfolioTitle,
          softwarePortfolioDescription: data.softwarePortfolioDescription,
          softwarePortfolioLinks: data.softwarePortfolioLinks,
          userEmail: req.jwt.email,
          template: data.templateChoice,
          imagesArray: imgArray,
        });

        return res.json({ msg: "Software portfolio created successfully." });
      } else if (data.templateChoice == 3) {
        const response = await database.collection("portfolio").insertOne({
          photoGalleryTitle: data.photoGalleryTitle,
          photoGalleryDescription: data.photoGalleryDescription,
          userEmail: req.jwt.email,
          template: data.templateChoice,
          imagesArray: imgArray,
        });

        return res.json({
          msg: "PhotoGallery portfolio created successfully.",
        });
      } else {
        return res.json({
          status: "ERROR",
          msg: "Failed to create a portfolio.",
        });
      }
    } catch (error) {}
  }
);

app.patch(
  "/portfolio/:id",
  [verify],
  upload.array("images", 10),
  async (req, res) => {
    let data = req.body;
    let id = req.params.id;
    await client.connect();
    let database = client.db("myportfolio");

    let imgArray = [];
    req.files.map((file) => {
      imgArray.push({
        data: fs.readFileSync("uploads/" + file.filename),
        contentType: "image/png",
      });
    });

    const portfolio_update_response = await database
      .collection("portfolio")
      .updateOne(
        { _id: ObjectId(id) },
        {
          $set: {
            projectTitle: data.projectTitle,
            projectSubtitle: data.projectSubtitle,
            projectDescription: data.projectDescription,
            projectLinks: data.projectLinks,
            userEmail: req.jwt.email,
            template: data.templateChoice,
            imagesArray: imgArray,
          },
        }
      );
    return res.json({ msg: "Portfolio information has successfully updated." });
  }
);

app.delete("/portfolio/:id", [verify], async (req, res) => {
  let id = req.params.id;
  await client.connect();
  let database = client.db("myportfolio");
  const portfolio_delete_response = await database
    .collection("portfolio")
    .deleteOne({ _id: ObjectId(id) });
  return res.json({ msg: "Portfolio deleted." });
});

//CHANGE PASSWORD

app.post("/change-password", async (req, res) => {
  let data = req.body;

  await client.connect();
  let database = client.db("myportfolio");
  let user_fgpass = await database
    .collection("user")
    .findOne({ email: data.email });

  if (user_fgpass == null) {
    res.json("User not registered");
    return false;
  } else {
  }

  const secret = process.env.JWT_KEY + user_fgpass.password;
  const payload = {
    email: user_fgpass.email,
    id: user_fgpass._id,
  };
  const token = jwt.sign(payload, secret, { expiresIn: "15 m" });

  const link = `https://celebrated-croquembouche-5cec65.netlify.app/change-password/${user_fgpass._id}/${token}`;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  let info = await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: payload.email,
    subject: "MyPortfolio password reset",
    text: link,
    html: `
    <div style="color: black;">
    <p>Hi ${user_fgpass.firstName},</p>
    <p>Forgot your password? \n We received a request to reset the password for your account.</p>
    <p>To reset the password click on the button below:</p>
    <button style="padding: 5px; border: none; border-radius: 5px; background: #089965;"><a style="text-decoration: none; color: white;" href="${link}">RESET PASSWORD</a></button>
    <p>...or copy the link below:</p>
    <p>${link}</p>
    <p>If this wasn't you, contact us by an e-mail.</p>
    </div>`,
  });

  return res.json({
    msg: `Email sent to ${payload.email}. Check your spam folder`,
  });
});

app.get("/change-password/:id/:token", async (req, res) => {
  let data = req.params;

  await client.connect();
  let database = client.db("myportfolio");
  let user_fgpass = await database
    .collection("user")
    .findOne({ _id: ObjectId(data.id) });

  if (user_fgpass == null) {
    res.json("Invalid id");
    return false;
  }

  const secret = process.env.JWT_KEY + user_fgpass.password;

  try {
    const payload = jwt.verify(data.token, secret);
    res.json({ email: user_fgpass.email });
  } catch (error) {
    res.json(error.message);
  }
});

app.post("/change-password/:id/:token", async (req, res) => {
  let data = req.params;
  let data_pass = req.body;

  await client.connect();
  let database = client.db("myportfolio");
  let user_fgpass = await database
    .collection("user")
    .findOne({ _id: ObjectId(data.id) });

  if (user_fgpass == null) {
    res.json("Invalid id");
    return false;
  }

  const secret = process.env.JWT_KEY + user_fgpass.password;

  try {
    const payload = jwt.verify(data.token, secret);

    let pass = await bcryptjs.hash(data_pass.password, 8);

    const response = await database
      .collection("user")
      .updateOne({ _id: ObjectId(data.id) }, { $set: { password: pass } });

    return res.json({ msg: "Password changed successfully." });
  } catch (error) {
    res.json(error.message);
  }
});

//PUBLIC PAGE

app.get("/public/:id", async (req, res) => {
  let data = req.params;

  await client.connect();
  let database = client.db("myportfolio");

  try {
    let public_user_response = await database
      .collection("user")
      .findOne({ _id: ObjectId(data.id) });
    let public_profile_image = await database
      .collection("profile_images")
      .findOne({ userEmail: public_user_response.email });
    let public_portfolio_response = await database
      .collection("portfolio")
      .find({ userEmail: public_user_response.email })
      .toArray();

    let public_data = [];
    public_data.push(
      public_user_response,
      public_profile_image,
      public_portfolio_response
    );

    res.json(public_data);
  } catch (error) {
    return res.json({ status: "ERROR", msg: "User doesn't exist." });
  }
});

//FUNCTIONS

function verify(req, res, next) {
  try {
    let authorization = req.headers.authorization.split(" ");
    let type = authorization[0];
    let token = authorization[1];

    if (type !== "Bearer") {
      res.status(401).send();
      return false;
    } else {
      req.jwt = jwt.verify(token, process.env.JWT_KEY);
      next();
    }
  } catch (error) {
    res.status(403).send({ status: "Error", msg: "Forbidden" });
    return false;
  }
}
