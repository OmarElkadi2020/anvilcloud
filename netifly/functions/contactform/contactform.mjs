import serverlessHttp from 'serverless-http';
import express from 'express';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import winston from 'winston';

const app = express();

// Enable CORS and JSON parsing
const corsOptions = {
  origin: 'https://anvilcloud.netlify.app', // Only allow your domain
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

// Set up Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Use Morgan for HTTP request logging (piped to Winston)
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Configure your email transporter (use environment variables for credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Set in Netlify dashboard or .env file
    pass: process.env.GMAIL_PASS,
  },
});

// Define your routes
app.get('/', (req, res) => {
  res.send('Hello from contactform!');
});

app.post('/', async (req, res) => {
  const { name, email, company, phone, inquiry, message } = req.body;
  logger.info('Received contact form submission', {
    name,
    email,
    company,
    phone,
    inquiry,
  });

  const text = `New Contact Form Submission:
                Inquiry: ${inquiry}
                Name: ${name}
                Email: ${email}
                Company: ${company}
                Phone: ${phone}

                Message:
                ${message}`;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: 'elkadi.omar.oe2@gmail.com', // Change to your destination email
    subject: `${inquiry.cpitalize()} inquiry received from ${name}`,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully');
    res.status(200).json({ success: true, message: 'Submission processed.' });
  } catch (error) {
    logger.error('Error sending email', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Wrap your Express app with serverless-http and store it in a variable
const serverlessHandler = serverlessHttp(app);


// Export your handler using ESM syntax and adjust the event path
const allowedApiKey = process.env.API_KEY;

export const handler = async (event, context) => {

  const origin = event.headers.origin || event.headers.referer;
  if (!origin || !origin.includes('anvilcloud.netlify.app')) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden' }),
    };
  }

  const apiKey = event.headers['x-api-key'];
  if (apiKey !== allowedApiKey) {
    logger.error('Forbidden request', { apiKey });
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden' }),
    };
  }

  // Proceed with your logic
  event.path = event.path.replace('/.netlify/functions/contactform', '') || '/';
  try {
    const response = await serverlessHandler(event, context);
    return response;
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error',
      }),
    };
  }
};