const serverless = require('serverless-http');
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');

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

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Configure your email transporter (example uses Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another provider
  auth: {
    user: 'elkadi.omar.oe@gmail.com',
    pass: 'vfbexpwzunihtsxj'
  }
});

// Define your /contact route as before
app.post('/contact', async (req, res) => {
  const { name, email, company, phone, inquiry, message } = req.body;
  logger.info('Received contact form submission', { name, email, company, phone, inquiry });
  
  const text = `We have received a new contact form submission. Here are the details:
  
- Inquiry Type: ${inquiry}
- Sender Name: ${name}
- Sender Email: ${email}
- Sender's Company: ${company}
- Sender's Phone: ${phone}

Message:
${message}`;

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
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions2);
    logger.info('Email sent successfully');

    // If you want to post to MS Teams, you can uncomment and configure the following:
    /*
    const teamsWebhookUrl = 'https://outlook.office.com/webhook/your-webhook-url';
    const teamsMessage = {
      text: `**New Contact Form Submission:**  
**Name:** ${name}  
**Email:** ${email}  
**Company:** ${company}  
**Phone:** ${phone}  
**Inquiry:** ${inquiry}  
**Message:** ${message}`
    };
    await fetch(teamsWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamsMessage)
    });
    logger.info('Message posted to Microsoft Teams successfully');
    */
    
    res.status(200).json({ success: true, message: 'Submission processed.' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error processing contact form submission', { error: errorMessage });
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Instead of app.listen(), export the serverless handler:
module.exports.handler = serverless(app);
console.log('Server running');