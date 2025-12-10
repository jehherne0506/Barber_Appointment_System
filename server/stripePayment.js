// require('dotenv').config();

// const stripe = require('stripe')(process.env.STRIPE_API_KEY);

// async function stripePayment(service, appointmentId, email){
//   const appointmentIdString = String(appointmentId);
//     const session = await stripe.checkout.sessions.create({
//         success_url: `http://localhost:5000/appointment/paymentSuccess?appointmentId=${appointmentIdString}&email=${encodeURIComponent(email)}`,
//         cancel_url: `http://localhost:5000/appointment/paymentFailure?appointmentId=${appointmentIdString}&?email=${encodeURIComponent(email)}`,
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
    success_url: `http://localhost:5000/appointment/paymentSuccess`,
    cancel_url: `http://localhost:5000/appointment/paymentFailure`,
    
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
