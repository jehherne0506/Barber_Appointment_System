require('dotenv').config();

const mongoose = require('mongoose');

async function connectMongoose(){
    try{console.log(process.env.MONGODB_URL)
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("DB Connected");
    } catch(err){
        console.log(err);
    }
}

module.exports = connectMongoose;