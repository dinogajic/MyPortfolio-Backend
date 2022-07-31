import mongoose from "mongoose";

const imgSchema = new mongoose.Schema({
  userEmail: String,
  name: String,
  img: {
    data: Buffer,
    contentType: String,
  },
});

let ProfileModel = mongoose.model("profile_image", imgSchema);

export default ProfileModel;