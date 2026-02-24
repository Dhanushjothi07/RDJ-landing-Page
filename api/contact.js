export default async function handler(req, res) {
    // 1. Absolute Minimal Response (Zero Imports)
    if (req.query.test === 'true') {
        return res.status(200).json({
            status: "Functional (Zero-Import Base)",
            node: process.version,
            env: {
                hasFirebase: !!process.env.FIREBASE_PRIVATE_KEY,
                hasGmail: !!process.env.GMAIL_APP_PASSWORD
            }
        });
    }

    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const formData = req.body;
        if (!formData || !formData.name) {
            return res.status(400).json({ error: 'Payload missing' });
        }

        // 2. Dynamic Imports (Only when needed)
        const [
            { initializeApp, cert, getApps },
            { getFirestore },
            nodemailer
        ] = await Promise.all([
            import('firebase-admin/app'),
            import('firebase-admin/firestore'),
            import('nodemailer')
        ]);

        // FIREBASE
        if (!getApps().length) {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
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
            source: 'vercel-api-dynamic'
        });

        // EMAIL
        const transporter = nodemailer.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"${formData.name}" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: `Lead: ${formData.name}`,
            text: `Inquiry from ${formData.name} (${formData.email})`
        });

        return res.status(200).json({ success: true, message: "Inquiry stored and email sent" });

    } catch (err) {
        console.error('CRITICAL_API_FAIL:', err);
        return res.status(500).json({
            error: 'Execution Failed',
            details: err.message,
            hint: "Check environment variables and Vercel logs"
        });
    }
}
