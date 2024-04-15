//import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

export default async function connect(){
    //const mongoServer= await MongoMemoryServer.create();
    const mongoUri="mongodb+srv://as920078kaushikmullick:UYaoRFldaNyX1mre@cluster0.nwertnq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

    await mongoose.connect(mongoUri,{dbName:"Cluster0"});
    console.log(`MongoDB successfully connected to ${mongoUri}`)
}