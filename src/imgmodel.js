import mongoose from "mongoose";

const imgSchema = new mongoose.Schema({
  userEmail: String,
  name: String,
  img: {
    data: Buffer,
    contentType: String,
  },
});

let ImageModel = mongoose.model("Image", imgSchema);

export default ImageModel;