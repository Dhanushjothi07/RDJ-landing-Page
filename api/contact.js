export default async function handler(req, res) {
    if (req.query.test === 'true') {
        return res.status(200).json({
            status: "Functional",
            env: {
                firebase_project: !!process.env.VITE_FIREBASE_PROJECT_ID,
                firebase_email: !!process.env.FIREBASE_CLIENT_EMAIL,
                firebase_key: !!process.env.FIREBASE_PRIVATE_KEY,
                gmail_user: !!process.env.GMAIL_USER,
                gmail_pass: !!process.env.GMAIL_APP_PASSWORD,
            }
        });
    }

    try {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

        const formData = req.body;
        if (!formData || !formData.name) return res.status(400).json({ error: 'Payload missing' });

        // Step 1: Dynamic Imports
        let imports;
        try {
            imports = await Promise.all([
                import('firebase-admin/app'),
                import('firebase-admin/firestore'),
                import('nodemailer')
            ]);
        } catch (e) { throw new Error(`[Step 1: Imports] ${e.message}`); }

        const [{ initializeApp, cert, getApps }, { getFirestore }, nodemailer] = imports;

        // Step 2: Firebase Init
        try {
            if (!getApps().length) {
                let privateKey = process.env.FIREBASE_PRIVATE_KEY;
                if (privateKey) {
                    // Handle various potential formatting issues for the private key
                    privateKey = privateKey.replace(/\\n/g, '\n');
                    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                        privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
                    }
                }

                if (!process.env.VITE_FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
                    throw new Error('Missing Firebase environment variables.');
                }

                initializeApp({
                    credential: cert({
                        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: privateKey,
                    }),
                });
            }
        } catch (e) { throw new Error(`[Step 2: Firebase Init] ${e.message}`); }

        // Step 3: Firestore Write
        try {
            const db = getFirestore();
            // Add a simple timeout/race to see if it hangs
            await db.collection('contacts').add({
                ...formData,
                timestamp: new Date(),
                source: 'vercel-diagnostics-v2'
            });
        } catch (e) { throw new Error(`[Step 3: Firestore Write] ${e.message}`); }

        // Step 4: Email Send
        try {
            const transporter = nodemailer.default.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD,
                },
                // Add some basic timeout
                connectionTimeout: 5000,
                greetingTimeout: 5000,
            });

            await transporter.sendMail({
                from: `"${formData.name}" <${process.env.GMAIL_USER}>`,
                to: process.env.GMAIL_USER,
                subject: `Lead: ${formData.name}`,
                text: `Inquiry from ${formData.name} (${formData.email})`
            });
        } catch (e) { throw new Error(`[Step 4: Email Send] ${e.message}`); }

        return res.status(200).json({ success: true, message: "Success" });

    } catch (err) {
        console.error('DIAGNOSTIC_ERROR:', err);
        return res.status(500).json({
            error: 'Execution Failed',
            details: err.message
        });
    }
}
