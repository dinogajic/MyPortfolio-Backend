import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({
  userEmail: String,
  name: String,
  portfolioName: String,
  img: {
    data: Buffer,
    contentType: String,
  },
});

let PortfolioModel = mongoose.model("portfolio_image", portfolioSchema);

export default PortfolioModel;
