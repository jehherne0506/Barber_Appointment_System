// require('dotenv').config();

// const stripe = require('stripe')(process.env.STRIPE_API_KEY);

// async function stripePayment(service, appointmentId, email){
//   const appointmentIdString = String(appointmentId);
//     const session = await stripe.checkout.sessions.create({
//         success_url: `https://barber-appointment-system-g7f5.onrender.com/appointment/paymentSuccess?appointmentId=${appointmentIdString}&email=${encodeURIComponent(email)}`,
//         cancel_url: `https://barber-appointment-system-g7f5.onrender.com/appointment/paymentFailure?appointmentId=${appointmentIdString}&?email=${encodeURIComponent(email)}`,
//         client_reference_id: appointmentIdString,
//         metadata: {appointmentIdString: appointmentIdString},
//         line_items: [
//             {
//               price_data: {
//                 currency: "myr",
//                 product_data: {
//                   name: service.name
//                 },
//                 unit_amount: service.price * 100
//               },
//               quantity: 1
//             }
//         ],
//         mode: 'payment',
//     });

//     return session.url;
// };

// module.exports = stripePayment;

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

async function stripePayment(service, appointmentId, email){  
  const appointmentIdString = String(appointmentId);

  const session = await stripe.checkout.sessions.create({
    success_url: `https://barber-appointment-system-g7f5.onrender.com/appointment/paymentSuccess`,
    cancel_url: `https://barber-appointment-system-g7f5.onrender.com/appointment/paymentFailure`,
    
    metadata: {
      appointmentId: appointmentIdString
    },

    line_items: [
      {
        price_data: {
          currency: "myr",
          product_data: { name: service.name },
          unit_amount: service.price * 100
        },
        quantity: 1
      }
    ],

    mode: 'payment',
  });



  return session.url;
}

module.exports = stripePayment;
