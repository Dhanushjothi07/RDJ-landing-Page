export default async function handler(req, res) {
    // 1. ABSOLUTE MINIMAL RESPONSE (No Dependencies)
    // If this fails, the issue is Vercel configuration/routing.
    if (req.query.test === 'true') {
        return res.status(200).json({
            message: "Minimal test successful",
            time: new Date().toISOString(),
            method: req.method,
            env_keys: Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('GMAIL'))
        });
    }

    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const formData = req.body || {};

        // 2. Perform imports INSIDE the POST handler to isolate errors
        const { initializeApp, cert, getApps } = await import('firebase-admin/app');
        const { getFirestore } = await import('firebase-admin/firestore');
        const nodemailer = (await import('nodemailer')).default;

        // 3. FIREBASE
        if (!getApps().length) {
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;
            if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

            initializeApp({
                credential: cert({
                    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });
        }
        const db = getFirestore();
        await db.collection('contacts').add({
            ...formData,
            timestamp: new Date(),
            source: 'vercel-minimal-v3'
        });

        // 4. EMAIL
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"${formData.name || 'Web'}" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: `New Lead: ${formData.name || 'Anonymous'}`,
            text: JSON.stringify(formData, null, 2)
        });

        return res.status(200).json({ success: true });

    } catch (err) {
        return res.status(500).json({
            error: 'Handler Failed',
            message: err.message,
            stack: err.stack?.split('\n')[0]
        });
    }
}
