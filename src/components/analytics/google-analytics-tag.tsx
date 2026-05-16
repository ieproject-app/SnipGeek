import Script from "next/script";

const explicitGaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const firebaseMeasurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
const gaId = explicitGaId || firebaseMeasurementId;
const disableAutoPageView = !explicitGaId && Boolean(firebaseMeasurementId);

export function GoogleAnalyticsTag() {
  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: ${disableAutoPageView ? "false" : "true"} });
        `}
      </Script>
    </>
  );
}
