import React from "react";

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-10 space-y-8">
      {/* Header */}
      <header className="bg-white rounded-2xl border shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </header>

      {/* English Terms */}
      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">English</h2>
        <ol className="list-decimal pl-5 text-sm text-gray-800 space-y-2">
          <li>
            Monthly interest is charged on outstanding principal unless
            specified otherwise in the loan agreement.
          </li>
          <li>
            Lock-in period implies that interest for the full term applies.
            Early closure during the lock-in may still attract full-term
            interest as per policy.
          </li>
          <li>
            A minimum number of months of interest may apply even on early
            closure or prepayment. Refer to your sanction letter for the exact
            minimum.
          </li>
          <li>
            Collateral details provided by the borrower must be accurate and up
            to date. Any discrepancy may lead to rejection or legal action.
          </li>
          <li>
            Late payment charges and applicable taxes are additional and will be
            borne by the borrower.
          </li>
          <li>
            All repayments must be made via approved payment methods only. Cash
            payments are accepted solely at authorized counters (if applicable).
          </li>
          <li>
            In case of default, the lender reserves the right to realize
            collateral as per applicable laws and the loan agreement.
          </li>
          <li>
            Policy terms may change from time to time. The latest version
            published here supersedes older versions.
          </li>
        </ol>
      </section>

      {/* Hindi Terms */}
      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">हिन्दी</h2>
        <ol className="list-decimal pl-5 text-sm text-gray-800 space-y-2">
          <li>
            मासिक ब्याज बकाया मूलधन पर लिया जाता है, जब तक कि ऋण अनुबंध में
            अन्यथा न लिखा हो।
          </li>
          <li>
            लॉक-इन अवधि का अर्थ है कि पूर्ण अवधि का ब्याज लागू होगा। लॉक-इन के
            दौरान समय से पहले बंद करने पर भी नीति अनुसार पूर्ण अवधि का ब्याज लग
            सकता है।
          </li>
          <li>
            समय से पहले बंद करने या प्रीपेमेंट पर न्यूनतम महीनों का ब्याज लागू
            हो सकता है। सटीक न्यूनतम के लिए अपने स्वीकृति पत्र देखें।
          </li>
          <li>
            उधारकर्ता द्वारा दी गई गिरवी (कॉलेटरल) की जानकारी सही और अद्यतन होना
            आवश्यक है। किसी भी विसंगति पर आवेदन अस्वीकार या कानूनी कार्रवाई हो
            सकती है।
          </li>
          <li>
            लेट पेमेंट चार्ज और देय कर अतिरिक्त हैं और उधारकर्ता द्वारा वहन किए
            जाएंगे।
          </li>
          <li>
            सभी भुगतान केवल अनुमोदित भुगतान विधियों से ही किए जाएँ। नकद भुगतान
            (यदि लागू) केवल अधिकृत काउंटर पर स्वीकार्य है।
          </li>
          <li>
            डिफ़ॉल्ट की स्थिति में, ऋणदाता लागू क़ानूनों और ऋण अनुबंध के अनुसार
            गिरवी का निस्तारण करने का अधिकार रखता है।
          </li>
          <li>
            नीतियाँ समय-समय पर बदल सकती हैं। यहाँ प्रकाशित नवीनतम संस्करण पुराने
            संस्करणों पर प्रभावी होगा।
          </li>
        </ol>
      </section>

      {/* Footer Note */}
      <footer className="text-xs text-gray-500">
        For clarifications, please contact support with your loan ID. This page
        is for general guidance and does not replace the executed loan
        agreement.
      </footer>
    </div>
  );
}
