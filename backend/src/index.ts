import express from 'express';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import winston from 'winston';

const app = express();

// Set up CORS and JSON parsing
app.use(cors());
app.use(bodyParser.json());

// Configure Morgan to use Winston for HTTP request logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // Optionally, add file transports:
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' })
  ],
});


// Configure your email transporter (example uses SendGrid)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another provider
  auth: {
    user: 'elkadi.omar.oe@gmail.com',
    pass: 'vfbexpwzunihtsxj'
  }
});

// Your Microsoft Teams Incoming Webhook URL
// const teamsWebhookUrl = 'https://outlook.office.com/webhook/your-webhook-url';

app.post('/contact', async (req, res) => {
  const { name, email, company, phone, inquiry, message } = req.body;
  logger.info('Received contact form submission', { name, email, company, phone, inquiry });
  const text = `We have received a new contact form submission form, Here are the details:\n\n- Inquiry Type: ${inquiry}\n- Sender Name: ${name}\n- Sender Email: ${email}\n- Senders' Company: ${company}\n- Senders' Phone: ${phone}\n\nMessage:\n\n\t${message}`

  // Prepare the email
  const mailOptions = {
    from: 'elkadi.omar.oe@gmail.com',
    to: 'elkadi.omar.oe2@gmail.com',
    subject: `${inquiry} from ${name}`,
    text: text
  };

  const mailOptions2 = {
    from: 'elkadi.omar.oe@gmail.com',
    to: 'ti.ge.r@icloud.com',
    subject: `${inquiry} from ${name}`,
    text: text
  };

  try {
    // Send email
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions2);
    logger.info('Email sent successfully');

    // Post message to MS Teams
//     const teamsMessage = {
//       text: `**New Contact Form Submission:**  
// **Name:** ${name}  
// **Email:** ${email}  
// **Company:** ${company}  
// **Phone:** ${phone}  
// **Inquiry:** ${inquiry}  
// **Message:** ${message}`
//     };

//     await fetch(teamsWebhookUrl, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(teamsMessage)
//     });
//     logger.info('Message posted to Microsoft Teams successfully');
  
  res.status(200).json({ success: true, message: 'Submission processed.' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error processing contact form submission', { error: errorMessage });
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.listen(3000, () => {
  logger.info('Server listening on port 3000');
});
