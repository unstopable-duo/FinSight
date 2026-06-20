import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    try {
        console.log("URI:", process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI || "");
        console.log("Connected successfully");
        process.exit(0);
    } catch(err) {
        console.error("DB ERR:", err);
        process.exit(1);
    }
}
run();
