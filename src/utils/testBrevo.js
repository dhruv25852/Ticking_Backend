require('dotenv').config();
const { sendRegistrationWelcomeEmail } = require('../services/emailService');

const targetEmail = process.argv[2] || process.env.BREVO_SENDER_EMAIL || 'client@example.com';
const targetName = process.argv[3] || 'TICKING Collector';

console.log('====================================================');
console.log('   TICKING Luxury Horology - Brevo Diagnostic Test   ');
console.log('====================================================');
console.log('Configured SENDER_EMAIL :', process.env.BREVO_SENDER_EMAIL || '(Not configured / Empty)');
console.log('Configured SENDER_NAME  :', process.env.BREVO_SENDER_NAME || '(Not configured / Empty)');
console.log('API Key Status          :', process.env.BREVO_API_KEY ? 'Present (Key length: ' + process.env.BREVO_API_KEY.length + ' chars)' : '(Not configured / Empty)');
console.log('Target Recipient        :', targetEmail);
console.log('Target Name             :', targetName);
console.log('----------------------------------------------------');

sendRegistrationWelcomeEmail({ name: targetName, email: targetEmail })
  .then((result) => {
    console.log('Dispatch Outcome:', JSON.stringify(result, null, 2));
    if (result.success) {
      console.log('SUCCESS: Welcome email dispatched successfully via Brevo API.');
    } else if (result.skipped) {
      console.log('NOTICE: Email was skipped because Brevo credentials are not yet configured in backend/.env.');
    } else {
      console.log('ATTENTION: Brevo API returned an error:', result.error);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unexpected failure during test:', err.message);
    process.exit(1);
  });
