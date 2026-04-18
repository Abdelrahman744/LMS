
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";
import { app } from "./app.js";

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, 
  socketTimeoutMS: 45000,
})
  .then(() => console.log("Connected to MongoDB!"))
  .catch(err => console.error("MongoDB Connection Failed:", err.message));
const port = process.env.PORT || 3000;


if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`App running on port ${port}...`);
  });
}


export default app;