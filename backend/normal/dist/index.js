"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const winston_1 = __importDefault(require("winston"));
const app = (0, express_1.default)();
// Set up CORS and JSON parsing
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// Configure Morgan to use Winston for HTTP request logging
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
        // Optionally, add file transports:
        // new winston.transports.File({ filename: 'error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'combined.log' })
    ],
});
// Configure your email transporter (example uses SendGrid)
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail', // or another provider
    auth: {
        user: 'elkadi.omar.oe@gmail.com',
        pass: 'vfbexpwzunihtsxj'
    }
});
// Your Microsoft Teams Incoming Webhook URL
// const teamsWebhookUrl = 'https://outlook.office.com/webhook/your-webhook-url';
app.post('/contact', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, company, phone, inquiry, message } = req.body;
    logger.info('Received contact form submission', { name, email, company, phone, inquiry });
    const text = `We have received a new contact form submission form, Here are the details:\n\n- Inquiry Type: ${inquiry}\n- Sender Name: ${name}\n- Sender Email: ${email}\n- Senders' Company: ${company}\n- Senders' Phone: ${phone}\n\nMessage:\n\n\t${message}`;
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
        yield transporter.sendMail(mailOptions);
        yield transporter.sendMail(mailOptions2);
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error processing contact form submission', { error: errorMessage });
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
app.listen(3000, () => {
    logger.info('Server listening on port 3000');
});
