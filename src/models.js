import mongoose from "mongoose";

/* const imgSchema = new mongoose.Schema({
  userEmail: String,
  name: String,
  img: {
    data: Buffer,
    contentType: String,
  },
}); */

const portfolioSchema = new mongoose.Schema({
  userEmail: String,
  name: String,
  portfolioName: String,
  img: {
    data: Buffer,
    contentType: String,
  },
});


/* let ImageModel = mongoose.model("Image", imgSchema); */
let PortfolioModel = mongoose.model("Portfolio", portfolioSchema);

export default PortfolioModel;
