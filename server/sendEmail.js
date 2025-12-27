const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "050607yjh@gmail.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendVerificationEmail(email, url){
    try{
        await transporter.sendMail({
            from: '"BuyLo" <050607yjh@gmail.com>',
            to: email,
            subject: '🌟 Verify Your Account - Start Appointing Today!',
            html: generateVerificationTemplate(url),
            text: `Welcome to BuyLo! Please verify your email by clicking this link: ${url}`
        });
        return true;
    } catch(err){
        console.log(err);
        return false;
    }
}

function generateVerificationTemplate(url) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { 
                font-family: 'Arial', sans-serif; 
                background: #fffdf7; 
                margin: 0; 
                padding: 20px; 
            }
            .email-container {
                max-width: 550px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(255, 193, 7, 0.2);
                border: 3px solid #FFEB3B;
            }
            .header-yellow {
                background: linear-gradient(135deg, #FFEB3B 0%, #FFC107 100%);
                padding: 40px 20px;
                text-align: center;
                color: #333;
            }
            .header-yellow h1 {
                margin: 0;
                font-size: 36px;
                font-weight: bold;
            }
            .content-yellow {
                padding: 40px 35px;
                text-align: center;
            }
            .yellow-button {
                background: linear-gradient(135deg, #FFD54F 0%, #FFB300 100%);
                color: #333;
                padding: 18px 45px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                font-size: 18px;
                display: inline-block;
                margin: 25px 0;
                box-shadow: 0 5px 15px rgba(255, 179, 0, 0.4);
                transition: all 0.3s ease;
                border: 2px solid #FFD54F;
            }
            .yellow-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(255, 179, 0, 0.6);
                background: linear-gradient(135deg, #FFC107 0%, #FFA000 100%);
            }
            .footer-yellow {
                background: #FFF9C4;
                padding: 25px;
                text-align: center;
                color: #FF6D00;
                font-size: 14px;
            }
            .note-box {
                background: #FFFDE7;
                border: 2px solid #FFE082;
                border-radius: 10px;
                padding: 20px;
                margin: 25px 0;
                color: #FF8F00;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header-yellow">
                <h1>BuyLo Verification</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 500;">Activate Your Account</p>
            </div>
            
            <div class="content-yellow">
                <h2 style="color: #FF9800; margin-bottom: 20px;">Almost There!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Click the button below to verify your email address and start your shopping journey with BuyLo!
                </p>
                
                <a href="${url}" class="yellow-button">
                    🛍️ Verify My Account
                </a>
                
                <div class="note-box">
                    <strong>📌 Quick Tip:</strong> This link expires in 24 hour. 
                    If you didn't sign up for BuyLo, no action is needed.
                </div>
                
                <p style="color: #FF9800; font-size: 14px; margin-top: 30px;">
                    <strong>Alternative:</strong> If the button doesn't work, visit this URL:<br>
                    <span style="background: #FFF9C4; padding: 10px; border-radius: 5px; display: inline-block; margin-top: 10px; font-family: monospace;">${url}</span>
                </p>
            </div>
            
            <div class="footer-yellow">
                <p><strong>Thank you for choosing BuyLo! 🎊</strong></p>
                <p>&copy; ${new Date().getFullYear()} BuyLo - Your Favorite Shopping Companion</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateAppointmentTemplate(appointment) {
    const {
        date,
        startedAt,
        endedAt,
        paymentStatus,
        status
    } = appointment;

    const customerName = appointment.customerId.username;
    const serviceName = appointment.serviceId.name;
    const staffName = appointment.staffId.username; // <- FIXED
    const price = appointment.serviceId.price;       // <- YOUR NEW FIELD

    const formattedDate = new Date(date).toLocaleDateString("en-MY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    return `
    <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        
        <h2 style="color: #333; margin-bottom: 10px;">Appointment Confirmation</h2>
        <p style="color: #555; font-size: 15px;">
            Hello <strong>${customerName}</strong>,<br><br>
            Your appointment has been successfully scheduled. Below are the details:
        </p>

        <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">

          <tr>
            <td style="padding: 8px 0; color: #777;">Service:</td>
            <td style="padding: 8px 0; font-weight: bold;">${serviceName}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Price:</td>
            <td style="padding: 8px 0; font-weight: bold;">RM ${price.toFixed(2)}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Staff:</td>
            <td style="padding: 8px 0; font-weight: bold;">${staffName}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Date:</td>
            <td style="padding: 8px 0; font-weight: bold;">${formattedDate}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Time:</td>
            <td style="padding: 8px 0; font-weight: bold;">${startedAt} - ${endedAt}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Payment Status:</td>
            <td style="padding: 8px 0; font-weight: bold; color: ${
                paymentStatus === "PAID" ? "#009432" : 
                paymentStatus === "UNPAID" ? "#e84118" : "#f39c12"
            };">
              ${paymentStatus}
            </td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Appointment Status:</td>
            <td style="padding: 8px 0; font-weight: bold;">${status}</td>
          </tr>
        </table>

        <br>

        <div style="padding: 10px; background: #f0f0f0; border-left: 4px solid #4a90e2; margin-top: 20px;">
          <p style="margin: 0; color: #555; font-size: 14px;">
            Please ensure you arrive 5–10 minutes earlier.  
            If you need to reschedule, contact us at least 24 hours before your appointment.
          </p>
        </div>

        <br>

        <p style="color: #555; font-size: 14px;">Thank you for choosing our service!</p>
        <p style="font-size: 13px; color: #aaa;">This is an automated email. Do not reply.</p>
      </div>
    </div>
    `;
}

function generateCancelAppointmentTemplate(appointment) {
    const {
        date,
        startedAt,
        endedAt,
        paymentStatus,
        status
    } = appointment;

    const customerName = appointment.customerId.username;
    const serviceName = appointment.serviceId.name;
    const staffName = appointment.staffId.username;
    const price = appointment.serviceId.price;

    const formattedDate = new Date(date).toLocaleDateString("en-MY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    return `
    <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        
        <h2 style="color: #d63031; margin-bottom: 10px;">Appointment Cancelled</h2>
        <p style="color: #444; font-size: 15px;">
            Hello <strong>${customerName}</strong>,<br><br>
            Your appointment has been successfully <span style="font-weight:bold; color:#c0392b;">cancelled</span>. Below are the cancellation details:
        </p>

        <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">

          <tr>
            <td style="padding: 8px 0; color: #777;">Service:</td>
            <td style="padding: 8px 0; font-weight: bold;">${serviceName}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Price:</td>
            <td style="padding: 8px 0; font-weight: bold;">RM ${price.toFixed(2)}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Staff Assigned:</td>
            <td style="padding: 8px 0; font-weight: bold;">${staffName}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Scheduled Date:</td>
            <td style="padding: 8px 0; font-weight: bold;">${formattedDate}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Scheduled Time:</td>
            <td style="padding: 8px 0; font-weight: bold;">${startedAt} - ${endedAt}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Payment Status:</td>
            <td style="padding: 8px 0; font-weight:bold; color:${
                paymentStatus === "PAID" ? "#009432" :
                paymentStatus === "UNPAID" ? "#e84118" : "#f39c12"
            };">
              ${paymentStatus}
            </td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Final Status:</td>
            <td style="padding: 8px 0; font-weight: bold; color:#d63031;">CANCELLED</td>
          </tr>

        </table>

        <br>

        <div style="padding: 12px; background: #fff0f0; border-left: 4px solid #d63031; margin-top: 20px; border-radius: 5px;">
          <p style="margin: 0; color: #c0392b; font-size: 14px;">
            If this cancellation was made by mistake, please contact us as soon as possible to rebook your session.
          </p>
        </div>

        <br>

        <p style="color: #555; font-size: 14px;">We hope to serve you again soon!</p>
        <p style="font-size: 13px; color: #aaa;">This is an automated email. Do not reply.</p>

      </div>
    </div>
    `;
}

function generateInProgressAppointmentTemplate(appointment) {
    const {
        date,
        startedAt,
        endedAt,
        paymentStatus
    } = appointment;

    const customerName = appointment.customerId.username;
    const serviceName = appointment.serviceId.name;
    const staffName = appointment.staffId.username;
    const price = appointment.serviceId.price;

    const formattedDate = new Date(date).toLocaleDateString("en-MY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    return `
    <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        
        <h2 style="color: #0984e3; margin-bottom: 10px;">Appointment In Progress</h2>
        <p style="color: #444; font-size: 15px;">
            Hello <strong>${customerName}</strong>,<br><br>
            Your scheduled appointment is now <span style="font-weight:bold; color:#0984e3;">in progress</span>. Sit back and relax while our staff attends to you!
        </p>

        <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">

          <tr>
            <td style="padding: 8px 0; color: #777;">Service:</td>
            <td style="padding: 8px 0; font-weight: bold;">${serviceName}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Price:</td>
            <td style="padding: 8px 0; font-weight: bold;">RM ${price.toFixed(2)}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Staff Assigned:</td>
            <td style="padding: 8px 0; font-weight: bold;">${staffName}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Date:</td>
            <td style="padding: 8px 0; font-weight: bold;">${formattedDate}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Time:</td>
            <td style="padding: 8px 0; font-weight: bold;">${startedAt} - ${endedAt}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Payment Status:</td>
            <td style="padding: 8px 0; font-weight:bold; color:${
                paymentStatus === "PAID" ? "#009432" :
                paymentStatus === "UNPAID" ? "#e84118" : "#f39c12"
            };">${paymentStatus}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Current Status:</td>
            <td style="padding: 8px 0; font-weight:bold; color:#0984e3;">IN PROGRESS</td>
          </tr>

        </table>

        <br>

        <div style="padding: 12px; background: #eaf4ff; border-left: 4px solid #0984e3; margin-top: 20px; border-radius: 5px;">
          <p style="margin: 0; color: #0984e3; font-size: 14px;">
            We will notify you once your appointment is completed. Thank you for your patience!
          </p>
        </div>

        <br>

        <p style="color: #555; font-size: 14px;">We hope you enjoy your experience with us!</p>
        <p style="font-size: 13px; color: #aaa;">This is an automated email. Do not reply.</p>

      </div>
    </div>
    `;
}

function generateCompletedAppointmentTemplate(appointment) {
    const {
        date,
        startedAt,
        endedAt,
        paymentStatus
    } = appointment;

    const customerName = appointment.customerId.username;
    const serviceName = appointment.serviceId.name;
    const staffName = appointment.staffId.username;
    const price = appointment.serviceId.price;

    const formattedDate = new Date(date).toLocaleDateString("en-MY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    return `
    <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        
        <h2 style="color: #27ae60; margin-bottom: 10px;">Appointment Completed</h2>
        <p style="color: #444; font-size: 15px;">
            Hello <strong>${customerName}</strong>,<br><br>
            Your appointment has been successfully <span style="font-weight:bold; color:#27ae60;">completed</span>! We hope you enjoyed our service.
        </p>

        <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">

          <tr>
            <td style="padding: 8px 0; color: #777;">Service:</td>
            <td style="padding: 8px 0; font-weight: bold;">${serviceName}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Price:</td>
            <td style="padding: 8px 0; font-weight: bold;">RM ${price.toFixed(2)}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Staff:</td>
            <td style="padding: 8px 0; font-weight: bold;">${staffName}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Date:</td>
            <td style="padding: 8px 0; font-weight: bold;">${formattedDate}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Time:</td>
            <td style="padding: 8px 0; font-weight: bold;">${startedAt} - ${endedAt}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Payment Status:</td>
            <td style="padding: 8px 0; font-weight:bold; color:${
                paymentStatus === "PAID" ? "#009432" :
                paymentStatus === "UNPAID" ? "#e84118" : "#f39c12"
            };">${paymentStatus}</td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #777;">Current Status:</td>
            <td style="padding: 8px 0; font-weight:bold; color:#27ae60;">COMPLETED</td>
          </tr>

        </table>

        <br>

        <div style="padding: 12px; background: #e9f9ee; border-left: 4px solid #27ae60; margin-top: 20px; border-radius: 5px;">
          <p style="margin: 0; color: #27ae60; font-size: 14px;">
            Thank you for choosing us! We look forward to serving you again soon.
          </p>
        </div>

        <br>

        <p style="color: #555; font-size: 14px;">If you have any feedback, feel free to reach out.</p>
        <p style="font-size: 13px; color: #aaa;">This is an automated email. Do not reply.</p>

      </div>
    </div>
    `;
}

function generateUserFeedbackTemplate(feedback) {
    const { name, date, service, comment } = feedback;

    const formattedDate = new Date(date).toLocaleDateString("en-MY", {
        weekday: "short", year: "numeric", month: "short", day: "numeric",
    });

    return `
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:10px;">
        
        <h2 style="color:#27ae60;">Thank You for Your Feedback! 🌟</h2>

        <p style="color:#444;">
          Hi <strong>${name}</strong>,<br><br>
          We truly appreciate you taking the time to share your feedback with us.
        </p>

        <table style="width:100%; margin-top:15px;">
          <tr>
            <td style="color:#777;">Service:</td>
            <td><strong>${service}</strong></td>
          </tr>
          <tr>
            <td style="color:#777;">Your Comment:</td>
            <td><strong>${comment }</strong></td>
          </tr>
        </table>

        <br>

        <p style="color:#555;">
          Your feedback helps us improve our service and provide a better experience for you.
        </p>

        <p style="font-size:13px; color:#aaa;">
          Submitted on ${new Date(formattedDate).toLocaleString("en-MY")}
        </p>

        <p style="color:#27ae60; font-weight:bold;">— BuyLo Team</p>
      </div>
    </div>
    `;
}

function generateAdminFeedbackNotificationTemplate(feedback) {
    const { id, name, email, date, service, comment } = feedback;

    const formattedDate = new Date(date).toLocaleDateString("en-MY", {
        weekday: "short", year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
    });

    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f8; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-left: 5px solid #34495e; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2c3e50; font-size: 20px;">📢 New User Feedback</h2>
            <span style="font-size: 12px; background: #ecf0f1; padding: 4px 8px; border-radius: 4px; color: #7f8c8d;">ID: ${id || 'N/A'}</span>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 10px 0; color: #7f8c8d; width: 100px;">User:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #2c3e50;">${name}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #7f8c8d;">Email:</td>
                <td style="padding: 10px 0; color: #2980b9;">${email}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #7f8c8d;">Date:</td>
                <td style="padding: 10px 0; color: #2c3e50;">${formattedDate}</td>
            </tr>
            <tr>
            <td style="color:#777;">Service:</td>
            <td><strong>${service}</strong></td>
          </tr>
        </table>

        <div style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 0 0 5px 0; color: #95a5a6; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Message Content</p>
            <p style="margin: 0; color: #34495e; line-height: 1.5; font-size: 15px;">
                "${comment}"
            </p>
        </div>

        <div style="margin-top: 25px; text-align: center;">
            <a href="#" style="background: #34495e; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 14px;">View in Admin Panel</a>
        </div>
      </div>
    </div>
    `;
}

function generateVerifyEmailChangeTemplate(url) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f7f7f7;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #fbc531, #f39c12);
                padding: 30px;
                text-align: center;
                color: #333;
            }
            .header h1 {
                margin: 0;
            }
            .content {
                padding: 30px;
                text-align: center;
                color: #555;
            }
            .button {
                display: inline-block;
                margin: 25px 0;
                padding: 15px 40px;
                background: #f39c12;
                color: #fff;
                text-decoration: none;
                border-radius: 30px;
                font-weight: bold;
                font-size: 16px;
            }
            .button:hover {
                background: #e67e22;
            }
            .note {
                background: #fff3cd;
                padding: 15px;
                border-radius: 8px;
                margin-top: 20px;
                font-size: 14px;
                color: #856404;
            }
            .footer {
                background: #fafafa;
                padding: 20px;
                text-align: center;
                font-size: 13px;
                color: #aaa;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Email Change Request</h1>
            </div>

            <div class="content">
                <p>
                    We received a request to change the email address linked to your BuyLo account.
                </p>

                <p>
                    Please confirm this change by clicking the button below:
                </p>

                <a href="${url}" class="button">Verify Email Change</a>

                <div class="note">
                    ⚠️ This link will expire in <strong>24 hours</strong>.<br>
                    If you did not request this change, please ignore this email.
                </div>

                <p style="margin-top: 20px; font-size: 14px;">
                    If the button does not work, copy and paste this link into your browser:<br>
                    <span style="word-break: break-all;">${url}</span>
                </p>
            </div>

            <div class="footer">
                © ${new Date().getFullYear()} BuyLo. All rights reserved.<br>
                This is an automated email. Please do not reply.
            </div>
        </div>
    </body>
    </html>
    `;
}

async function sendMakeAppointmentDetails(appointment, email){
    try{
        await transporter.sendMail({
            from: '"BuyLo" <050607yjh@gmail.com>',
            to: email,
            subject: '🌟 Appointment Successfully Made!',
            html: generateAppointmentTemplate(appointment),
            text: "Your Appointment had been made Successfully!"
        });
        return true;
    } catch(err){
        console.log(err);
        return false;
    }
}

async function sendRescheduleAppointmentDetails(appointment, email){
    try{console.log('send')
        await transporter.sendMail({
            from: '"BuyLo" <050607yjh@gmail.com>',
            to: email,
            subject: '🌟 Appointment Successfully Reschedule!',
            html: generateAppointmentTemplate(appointment),
            text: "Your Appointment had been reschedule Successfully!"
        });
        return true;
    } catch(err){
        console.log(err);
        return false;
    }
}

async function sendDeleteAppointmentDetails(appointment, email){
    try{console.log('send')
        await transporter.sendMail({
            from: '"BuyLo" <050607yjh@gmail.com>',
            to: email,
            subject: '🌟 Appointment Successfully Cancelled!',
            html: generateCancelAppointmentTemplate(appointment),
            text: "Your Appointment had been cancel Successfully!"
        });
        return true;
    } catch(err){
        console.log(err);
        return false;
    }
}

async function sendAppointmentInProgress(appointment, email){
    try{console.log('send')
        await transporter.sendMail({
            from: '"BuyLo" <050607yjh@gmail.com>',
            to: email,
            subject: '🌟 Appointment is in Progress!',
            html: generateInProgressAppointmentTemplate(appointment),
            text: "Your Appointment is in progress!"
        });
        return true;
    } catch(err){
        console.log(err);
        return false;
    }
}

async function sendAppointmentCompleted(appointment, email){
    try{console.log('send')
        await transporter.sendMail({
            from: '"BuyLo" <050607yjh@gmail.com>',
            to: email,
            subject: '🌟 Appointment is completed!',
            html: generateCompletedAppointmentTemplate(appointment),
            text: "Your Appointment is completed!"
        });
        return true;
    } catch(err){
        console.log(err);
        return false;
    }
}

async function sendFeedback(feedback, email){
  try{console.log('send')
        await transporter.sendMail({
            from: '"BuyLo" <050607yjh@gmail.com>',
            to: email,
            subject: '🌟 Feedback Made Successfully!',
            html: generateUserFeedbackTemplate(feedback),
            text: "Feedback Made Successfully!"
        });

        await transporter.sendMail({
            from: '"BuyLo" <050607yjh@gmail.com>',
            to: '"BuyLo" <050607yjh@gmail.com>',
            subject: '🌟 A User has Make a Feedback!',
            html: generateAdminFeedbackNotificationTemplate(feedback),
            text: "A User has Make a Feedback!"
        });
        return true;
    } catch(err){
        console.log(err);
        return false;
    }
}

async function sendVerifyEmailChange(email, verifyLink){
  try {
      await transporter.sendMail({
          from: '"BuyLo" <050607yjh@gmail.com>',
          to: email,
          subject: '🔐 Confirm Your Email Change',
          html: generateVerifyEmailChangeTemplate(verifyLink),
          text: `Confirm your email change by clicking this link: ${verifyLink}`
      });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
}

module.exports = {sendVerificationEmail, sendMakeAppointmentDetails, sendRescheduleAppointmentDetails, sendDeleteAppointmentDetails, sendAppointmentInProgress, sendAppointmentCompleted, sendFeedback, sendVerifyEmailChange};