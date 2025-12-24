import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MONGODB CONNECTED SUCCESSFULLY!");
  } catch (error) {
    console.error("Error connecting to MONGODB", error);
    process.exit(1); // exit with failure
  }
};

// mongodb+srv://vermaranjan62_db_user:NNTjhhMym8UZC4YC@cluster0.rhlvcvy.mongodb.net/notes_db?appName=Cluster0
