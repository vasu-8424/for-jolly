import React from "react";

export const metadata = {
  title: "Privacy Policy - Kakinada Fresh",
  description: "Privacy Policy for Kakinada Fresh Mobile Application & Services",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-slate-800 font-sans leading-relaxed">
      <h1 className="text-3xl font-bold text-emerald-700 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Effective Date: August 7, 2026</p>

      <section className="mb-8">
        <p className="mb-4">
          Welcome to <strong>Kakinada Fresh</strong> ("we", "our", or "us"). We are committed to protecting your personal privacy when you use our mobile application and online ordering services.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit or use the <strong>Kakinada Fresh</strong> mobile app.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-2 text-slate-700">
          <li><strong>Personal Information:</strong> Name, phone number, email address, delivery address, and account credentials provided during registration or checkout.</li>
          <li><strong>Location Information:</strong> Precise or approximate location data collected with your permission to determine service availability and deliver your orders accurately.</li>
          <li><strong>Device & Usage Information:</strong> Device model, operating system version, unique device identifiers, and interaction data within the app.</li>
          <li><strong>Transaction Information:</strong> Order details, order history, payment status, and delivery preferences.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2 text-slate-700">
          <li>To process and fulfill your orders, including delivery and payment processing.</li>
          <li>To communicate order status updates, delivery notifications, and customer support assistance.</li>
          <li>To personalize your shopping experience and present relevant product offers.</li>
          <li>To detect and prevent fraudulent transactions and ensure system security.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Data Sharing & Disclosure</h2>
        <p className="mb-3 text-slate-700">We do not sell your personal information. We may share information only in the following necessary circumstances:</p>
        <ul className="list-disc pl-6 space-y-2 text-slate-700">
          <li><strong>Delivery Personnel & Partners:</strong> Sharing contact and address details to deliver orders to your location.</li>
          <li><strong>Service Providers:</strong> Secure payment gateways, authentication providers (e.g. Firebase/Supabase), and cloud infrastructure partners.</li>
          <li><strong>Legal Requirements:</strong> If required by law, regulation, or legal process.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Security</h2>
        <p className="text-slate-700">
          We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Your Rights & Choices</h2>
        <p className="text-slate-700">
          You can update your account profile and delivery addresses directly within the app. You may also disable location permissions at any time via your device settings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Contact Us</h2>
        <p className="text-slate-700">
          If you have any questions or concerns regarding this Privacy Policy, please contact us at:
        </p>
        <div className="mt-3 p-4 bg-slate-100 rounded-lg text-slate-800">
          <p><strong>Kakinada Fresh Support</strong></p>
          <p>Email: <a href="mailto:kakinadafresh@gmail.com" className="text-emerald-700 underline">kakinadafresh@gmail.com</a></p>
          <p>Phone: +91 7989948996</p>
        </div>
      </section>

      <hr className="my-8 border-slate-200" />
      <p className="text-xs text-slate-400 text-center">© 2026 Kakinada Fresh. All Rights Reserved.</p>
    </div>
  );
}
