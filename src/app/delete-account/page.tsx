import React from "react";

export const metadata = {
  title: "Account & Data Deletion Request - Kakinada Fresh",
  description: "Request deletion of your Kakinada Fresh account and associated personal data.",
};

export default function DeleteAccountPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-slate-800 font-sans leading-relaxed">
      <h1 className="text-3xl font-bold text-red-600 mb-2">Request Account & Data Deletion</h1>
      <p className="text-sm text-slate-500 mb-6">Kakinada Fresh Mobile Application</p>

      <div className="p-4 mb-8 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
        <strong>Important:</strong> Account deletion is permanent. Once your account is deleted, your saved addresses, active cart, loyalty points, and order history will no longer be accessible.
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">How to Request Account Deletion</h2>
        <p className="mb-4 text-slate-700">
          You can request the deletion of your account and associated personal data by following these steps:
        </p>

        <ol className="list-decimal pl-6 space-y-3 text-slate-700">
          <li>
            <strong>In-App Deletion:</strong> Open the <strong>Kakinada Fresh</strong> app $\rightarrow$ Go to <strong>Profile</strong> $\rightarrow$ Scroll down to <strong>Account Settings</strong> $\rightarrow$ Tap <strong>Delete Account</strong> and confirm.
          </li>
          <li>
            <strong>Email Request:</strong> If you cannot access the app, send an email from your registered email address or specify your registered phone number to:
            <div className="mt-2 p-3 bg-slate-100 rounded-md font-mono text-emerald-800 font-bold">
              kakinadafresh@gmail.com
            </div>
            <p className="mt-2 text-xs text-slate-500">Subject line: <em>Account Deletion Request - [Your Phone Number]</em></p>
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Types of Data Deleted vs. Retained</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
            <h3 className="font-bold text-red-800 mb-2">Data Deleted Immediately</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li>User profile & account credentials</li>
              <li>Saved delivery addresses</li>
              <li>Saved payment methods & preferences</li>
              <li>Push notification tokens</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-bold text-slate-800 mb-2">Data Retained (For Legal Compliance)</h3>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
              <li>Financial invoice & tax records (retained as required by applicable tax laws).</li>
              <li>Past transaction logs for fraud prevention.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Processing Time</h2>
        <p className="text-slate-700">
          In-app deletion takes effect immediately. Email deletion requests are verified and processed within <strong>48 hours</strong> of receipt.
        </p>
      </section>

      <hr className="my-8 border-slate-200" />
      <p className="text-xs text-slate-400 text-center">© 2026 Kakinada Fresh. All Rights Reserved.</p>
    </div>
  );
}
