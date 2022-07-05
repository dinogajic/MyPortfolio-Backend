import mongoose from "mongoose";

const imgSchema = new mongoose.Schema({
  name: String,
  img: {
    data: Buffer,
    contentType: String,
  },
});

let ImageModel = mongoose.model("Image", imgSchema);

export default ImageModel