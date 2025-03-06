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
const node_fetch_1 = __importDefault(require("node-fetch"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
// Configure your email transporter (example uses SendGrid)
const transporter = nodemailer_1.default.createTransport({
    service: 'SendGrid', // or another provider
    auth: {
        user: 'YOUR_SENDGRID_USERNAME',
        pass: 'YOUR_SENDGRID_PASSWORD'
    }
});
// Your Microsoft Teams Incoming Webhook URL
const teamsWebhookUrl = 'https://outlook.office.com/webhook/your-webhook-url';
app.post('/contact', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, company, phone, inquiry, message } = req.body;
    // Prepare the email
    const mailOptions = {
        from: 'no-reply@yourdomain.com',
        to: 'your-email@example.com',
        subject: `New Contact Form Submission from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nPhone: ${phone}\nInquiry: ${inquiry}\nMessage: ${message}`
    };
    try {
        // Send email
        yield transporter.sendMail(mailOptions);
        // Post message to MS Teams
        const teamsMessage = {
            text: `**New Contact Form Submission:**  
**Name:** ${name}  
**Email:** ${email}  
**Company:** ${company}  
**Phone:** ${phone}  
**Inquiry:** ${inquiry}  
**Message:** ${message}`
        };
        yield (0, node_fetch_1.default)(teamsWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamsMessage)
        });
        res.status(200).json({ success: true, message: 'Submission processed.' });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
