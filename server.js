
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";
import { app } from "./app.js";

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment (set it in .env)");
  process.exit(1);
}


dns.setServers(['8.8.8.8','1.1.1.1']);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  }); 



const port = process.env.PORT || 3000;

// Only run the server if we are NOT on Vercel (Local Development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`App running on port ${port}...`);
  });
}

// Export the Express API for Vercel
export default app;