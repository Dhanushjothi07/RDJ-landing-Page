import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input, TextArea } from './ui/Input';
import { Button } from './ui/Button';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        requirement: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Simple client-side validation
        if (!formData.name || !formData.email || !formData.phone || !formData.requirement) {
            setErrorMessage('Please fill in all required fields.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            console.log("Attempting to send message to Firebase and Google Sheets...");
            if (!db) {
                console.error("Firebase DB object is null. Check your .env variables.");
                throw new Error('Firebase is not initialized.');
            }

            const submissionData = {
                ...formData,
                timestamp: serverTimestamp(),
                date: new Date().toLocaleString()
            };

            // 1. Submit to Firestore (Priority - we wait for this)
            const firestorePromise = addDoc(collection(db, "contacts"), submissionData);

            // 2. Submit to Google Sheets (Background - we don't wait for this)
            const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxeu7MYzvgoKisbcmC8f9Oy49gDIXdfyxs3-r7zuEBECdRAUouvfU7UdDkap3uruabI/exec';
            fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            }).catch(err => console.error("Background Sheet Sync Error:", err));

            // Create a timeout promise for Firestore
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 30000)
            );

            // Wait ONLY for Firestore to finish
            await Promise.race([
                firestorePromise,
                timeoutPromise
            ]);

            console.log("Message successfully saved!");
            setStatus('success');
            setFormData({ name: '', phone: '', email: '', requirement: '', message: '' });
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error('Detailed Submission Error:', error);
            setStatus('error');

            if (error.message === 'timeout') {
                setErrorMessage('Connection timed out after 30s. This usually means Firestore Rules are blocking the request.');
            } else if (error.code === 'permission-denied') {
                setErrorMessage('Permission denied. Please check your Firestore Rules.');
            } else {
                setErrorMessage(`Error: ${error.message || 'Check browser console for details.'}`);
            }
        }
    };


    return (
        <section id="contact" className="py-20 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Get In Touch</h2>
                    <p className="text-gray-400">
                        Ready to start your project? Fill out the form below.
                    </p>
                </motion.div>

                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-6 bg-surface/50 p-8 rounded-3xl border border-white/10 backdrop-blur-sm shadow-[0_0_50px_rgba(123,123,123,0.05)]"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            placeholder="John Doe"
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            placeholder="+1 (555) 000-0000"
                            label="Phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <Input
                        placeholder="john@example.com"
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        placeholder="Web Design, 3D Art, etc."
                        label="Need / Requirement"
                        name="requirement"
                        value={formData.requirement}
                        onChange={handleChange}
                        required
                    />
                    <TextArea
                        placeholder="Tell us more about your project..."
                        label="Message (Optional)"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                    />

                    <Button
                        className="w-full text-lg"
                        disabled={status === 'loading' || status === 'success'}
                    >
                        {status === 'loading' ? (
                            <>Sending... <Loader2 className="w-5 h-5 ml-2 animate-spin" /></>
                        ) : status === 'success' ? (
                            <>Sent Successfully! <CheckCircle2 className="w-5 h-5 ml-2" /></>
                        ) : (
                            <>Send Message <Send className="w-5 h-5 ml-2" /></>
                        )}
                    </Button>

                    {status === 'error' && (
                        <p className="text-red-400 text-center text-sm">
                            {errorMessage}
                        </p>
                    )}
                </motion.form>
            </div>
        </section>
    );
};

