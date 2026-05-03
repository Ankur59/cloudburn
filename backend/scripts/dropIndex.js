import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://ankur7002151588_db_user:v9ujJw2ur7Mmht7N@cluster0.6ehflfz.mongodb.net/cloudburn";

async function dropIndex() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    
    const db = mongoose.connection.db;
    const collection = db.collection("chats");
    
    console.log("Dropping shareSlug_1 index...");
    await collection.dropIndex("shareSlug_1");
    console.log("Index dropped successfully.");
  } catch (err) {
    console.error("Error dropping index:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

dropIndex();
