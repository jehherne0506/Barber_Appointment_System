require('dotenv').config({path: "./.env"});

const cron = require('node-cron');
const client = require("twilio")(process.env.TWILLO_ACCOUNT_SID, process.env.TWILLO_AUTH_TOKEN);console.log(client)

const connectMongoose = require('./connectMongoose');

const Appointment = require("./models/appointment");

async function scheduleSMS(){  
  cron.schedule('* * * * *', async()=>{console.log("run min")
    await connectMongoose();  
    const dateObj = new Date(new Date().toISOString().split("T")[0] + 'T00:00:00.000Z');
    const upcomingAppointments = await Appointment.find({
      date: dateObj
    }).populate("customerId", "phoneNumber");

    if(upcomingAppointments){
      const nowLocal = new Date();
      const now = new Date(nowLocal.getTime() - nowLocal.getTimezoneOffset()*60000);
      for(const appointment of upcomingAppointments){
        const diffMs = appointment.startedAtDate.getTime() - now;
        console.log("diffMs:", diffMs, "minutes:", diffMs/1000/60);
        if(diffMs <= 60*60*1000 && !appointment.smsNotified){
          // sendSMS
          console.log(appointment)
          await sendMessage(appointment)
          appointment.smsNotified = true;
          await appointment.save();
        }
      }

    };   
  });
};

async function sendMessage(appointment){
  try{
    const dateString = new Date(appointment.date).toISOString().split("T")[0];
    const message = await client.messages.create({
      from: "whatsapp:+14155238886", // sandbox number
      contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
      contentVariables: JSON.stringify({
        "1": dateString,
        "2": appointment.startedAt
      }),
      to: `whatsapp:${appointment?.customerId?.phoneNumber}`,
    });

    console.log(message.body);
  } catch(err){
    console.log(err);
  }
}

module.exports = scheduleSMS;