export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: January 25, 2026</p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
                    <p className="text-gray-600 leading-relaxed">
                        This Privacy Policy describes how FB Auto Poster (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
                        collects, uses, and shares information when you use our application. By using our
                        service, you agree to the collection and use of information in accordance with this policy.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
                    <p className="text-gray-600 leading-relaxed mb-3">
                        We collect the following types of information:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                        <li><strong>Facebook Page Access:</strong> We access your Facebook Pages to post content on your behalf.</li>
                        <li><strong>Content Data:</strong> Images and captions you upload for automated posting.</li>
                        <li><strong>Usage Data:</strong> Information about how you interact with our service.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                        <li>To provide and maintain our automated posting service</li>
                        <li>To post content to your Facebook Pages as scheduled</li>
                        <li>To improve and optimize our service</li>
                        <li>To communicate with you about service updates</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Storage and Security</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Your data is stored securely using industry-standard encryption. We use trusted
                        third-party services (Supabase, Cloudinary) to store your content. Access tokens
                        are stored securely and are never shared with third parties.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Data Sharing</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We do not sell, trade, or rent your personal information to third parties.
                        Your content is only shared with Facebook as required to post to your Pages.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Your Rights</h2>
                    <p className="text-gray-600 leading-relaxed">You have the right to:</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                        <li>Access the data we hold about you</li>
                        <li>Request deletion of your data</li>
                        <li>Revoke Facebook permissions at any time</li>
                        <li>Opt out of our service</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contact Us</h2>
                    <p className="text-gray-600 leading-relaxed">
                        If you have questions about this Privacy Policy, please contact us at:
                        <a href="mailto:febrinanda.co2@gmail.com" className="text-blue-600 hover:underline ml-1">
                            febrinanda.co2@gmail.com
                        </a>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Changes to This Policy</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We may update this Privacy Policy from time to time. We will notify you of any
                        changes by posting the new Privacy Policy on this page.
                    </p>
                </section>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-center text-gray-500 text-sm">
                        © 2026 FB Auto Poster. All rights reserved.
                    </p>
                </div>
            </div>
        </main>
    );
}
