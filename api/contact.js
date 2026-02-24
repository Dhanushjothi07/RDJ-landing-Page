import nodemailer from 'nodemailer';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Helper to get Firebase (Standard approach to avoid complexity)
const getFirebaseAdmin = () => {
    if (!getApps().length) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        if (!process.env.VITE_FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
            throw new Error('Firebase credentials missing');
        }
        initializeApp({
            credential: cert({
                projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    }
    return getFirestore();
};

export default async function handler(req, res) {
    // 1. Diagnostic Mode
    if (req.query.test === 'true') {
        return res.status(200).json({
            status: 'Function is reachable',
            config: {
                hasFirebase: !!process.env.FIREBASE_PRIVATE_KEY,
                hasGmail: !!process.env.GMAIL_APP_PASSWORD
            }
        });
    }

    // 2. Main Logic
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const formData = req.body;
        console.log('Received:', formData);

        // Firestore
        const db = getFirebaseAdmin();
        const docRef = await db.collection('contacts').add({
            ...formData,
            timestamp: new Date(),
            source: 'vercel-api-standard'
        });

        // Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"${formData.name}" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: `New Lead: ${formData.name}`,
            text: `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nRequirement: ${formData.requirement}\nMessage: ${formData.message}`
        });

        return res.status(200).json({ success: true, id: docRef.id });

    } catch (error) {
        console.error('SERVER ERROR:', error);
        return res.status(500).json({
            error: 'Server Error',
            details: error.message
        });
    }
}
