const Service = require("./service");
const mongoose = require("mongoose");
const STAFF_ID = "692fcf0d0bf8c5842c500661";
const MONGO_URI = "mongodb+srv://yeohjehherne_db_user:stqZ6mKKKJbMepCB@cluster0.niel1bt.mongodb.net/?appName=Cluster0";

const Appointment = require("./appointment");
const UnavailableTimeslot = require("./unavailableTimeslot");
const CUSTOMER_ID = "6926c50489b60712cb5727e0";


const services = [
  {
    name: "Haircut",
    durationMin: 30,
    durationBlock: 30 / 15, // 2
    price: 25,
    staff: [STAFF_ID],
  },
  {
    name: "Shaving",
    durationMin: 15,
    durationBlock: 15 / 15, // 1
    price: 10,
    staff: [STAFF_ID],
  },
  {
    name: "Hair Coloring",
    durationMin: 60,
    durationBlock: 60 / 15, // 4
    price: 60,
    staff: [STAFF_ID],
  },
  {
    name: "Facial",
    durationMin: 45,
    durationBlock: 45 / 15, // 3
    price: 40,
    staff: [STAFF_ID],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  console.log("Connected to DB");
  await Service.deleteMany({});
  console.log("Cleared old services");

  await Service.insertMany(services);
  console.log("Inserted new services");

  mongoose.connection.close();
}

seed();
