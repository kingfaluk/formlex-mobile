/** FormLex server the app talks to. */
export const SITE_URL = 'https://formlex.kodataltd.org';
export const API_URL = `${SITE_URL}/api`;
/** Deep link the payment page returns to after checkout (see PaymentController::callback). */
export const PAYMENT_RETURN_URL = 'formlex://payment';
