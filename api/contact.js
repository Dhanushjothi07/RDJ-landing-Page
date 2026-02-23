import nodemailer from 'nodemailer';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// Note: We use environment variables for security.
// Ensure these are set in your Vercel Project Settings.
if (!getApps().length) {
    try {
        initializeApp({
            credential: cert({
                projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace literal \n with actual newlines if the private key is passed as a string
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

const db = getFirestore();

// Helper to send email via NodeMailer
const sendEmail = async (formData) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD, // Use Gmail App Password
        },
    });

    const mailOptions = {
        from: `"${formData.name}" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER, // Send to yourself
        subject: 'New Lead Received',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">New Lead Details</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr><td style="padding: 10px; font-weight: bold; width: 30%;">Name:</td><td style="padding: 10px;">${formData.name}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold;">Email:</td><td style="padding: 10px;">${formData.email}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold;">Phone:</td><td style="padding: 10px;">${formData.phone}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold;">Requirement:</td><td style="padding: 10px;">${formData.requirement}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold;">Message:</td><td style="padding: 10px;">${formData.message || 'N/A'}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold;">Timestamp:</td><td style="padding: 10px;">${new Date().toLocaleString()}</td></tr>
                </table>
                <div style="margin-top: 30px; text-align: center; color: #777; font-size: 12px;">
                    Sent from your RDJ Landing Page Contact Form
                </div>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const formData = req.body;

        // 1. Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.requirement) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 2. Save to Firestore
        const docRef = await db.collection('contacts').add({
            ...formData,
            timestamp: new Date(),
            source: 'vercel-serverless'
        });

        console.log('Document written with ID: ', docRef.id);

        // 3. Send Email Notification
        await sendEmail(formData);

        return res.status(200).json({
            success: true,
            message: 'Lead captured and email sent successfully.',
            id: docRef.id
        });

    } catch (error) {
        console.error('Serverless Function Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
        });
    }
}
