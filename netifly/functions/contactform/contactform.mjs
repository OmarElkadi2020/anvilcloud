import serverlessHttp from 'serverless-http';
import express from 'express';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import winston from 'winston';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';


const app = express();

const allowedOrigins = ['https://anvilcloud.netlify.app', 'https://main--anvilcloud.netlify.app'];
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// HTTPS enforcement (if necessary)
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    logger.info('Redirecting request from HTTP to HTTPS');
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Parse JSON bodies
app.use(bodyParser.json());

// Add Helmet to secure HTTP headers
app.use(helmet());

// Rate limiting middleware to protect against too many requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

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
    subject: `${inquiry} inquiry received from ${name}`,
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

// Export your serverless handler
export const handler = async (event, context) => {

  // Check if the incoming request is using HTTPS via the x-forwarded-proto header
  if (event.headers['x-forwarded-proto'] !== 'https') {
    logger.warn('Redirecting request from HTTP to HTTPS');
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'HTTPS is required.' }),
    };
  }

  // Check if the request is coming
  // from your Netlify site
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://anvilcloud.netlify.app' || 'https://main--anvilcloud.netlify.app';
  const origin = event.headers.origin || event.headers.referer;
  if (!origin || !origin.startsWith(allowedOrigin)) {
    logger.warn('Forbidden request', { origin });
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
      },
      body: JSON.stringify({ error: 'Forbidden: invalid origin' }),
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