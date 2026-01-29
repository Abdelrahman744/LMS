import { app } from "./app.js";
import dotenv from "dotenv";
const mongoose = require("mongoose");

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("Error connecting to MongoDB:", err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`app running on port ${port} ......... `);
});
