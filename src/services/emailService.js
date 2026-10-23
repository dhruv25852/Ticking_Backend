const { BrevoClient } = require('@getbrevo/brevo');
const Settings = require('../models/Settings');

/**
 * Currency formatter for Indian Rupees ₹ (e.g., ₹1,840,000.00)
 */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  return (
    '₹' +
    Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
};

/**
 * Resolves watch images to valid absolute URLs for email clients.
 * Cloudinary URLs (https://...) are preserved.
 * Relative paths (/images/...) are prefixed with backend base URL.
 */
const resolveImageUrl = (imgUrl) => {
  if (!imgUrl) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
  }
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
    return imgUrl;
  }
  const backendBase = (
    process.env.BACKEND_URL ||
    process.env.BASE_URL ||
    'http://localhost:5000'
  ).replace(/\/+$/, '');
  const cleanPath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
  return `${backendBase}${cleanPath}`;
};

/**
 * Formats order date in Indian locale with readable time
 */
const formatOrderDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Helper to safely extract store settings or fallback defaults
 */
const getSafeSettings = (settings) => {
  const s = settings || {};
  return {
    storeName: (s.storeName || 'TICKING LUXARY WATCH').trim(),
    supportEmail: (s.supportEmail || 'ticking@gmail.com').trim(),
    phone: (s.phone || '9909225852').trim()
  };
};

/**
 * Generates a luxury black-and-gold responsive HTML welcome email for TICKING
 */
const generateWelcomeHtml = (name, email, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const firstName = (name || '').trim().split(' ')[0] || 'Collector';
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${storeName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #08080A;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E5E5E5;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    a {
      color: #D4AF37;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 10px !important;
      }
      .content-padding {
        padding: 25px 20px !important;
      }
      .column-pill {
        display: block !important;
        width: 100% !important;
        margin-bottom: 12px !important;
        border-left: none !important;
        border-right: none !important;
        border-bottom: 1px solid #1F1F2A !important;
        padding-bottom: 12px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #08080A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E5E5E5;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #08080A; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" class="container" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0F0F13; border: 1px solid #2A261A; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.85);">
          <!-- Top Gold Accent Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #996515 0%, #D4AF37 50%, #F3E5AB 100%);"></td>
          </tr>

          <!-- Header / Brand Emblem -->
          <tr>
            <td align="center" style="padding: 38px 30px 24px 30px; border-bottom: 1px solid #1C1C24;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border: 1.5px solid #D4AF37; background: #000000; text-align: center; margin-bottom: 12px;">
                      <span style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #D4AF37; letter-spacing: 2px;">T</span>
                    </div>
                    <div style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; letter-spacing: 0.35em; color: #F3E5AB; text-transform: uppercase;">
                      T I C K I N G
                    </div>
                    <div style="font-size: 9px; letter-spacing: 0.3em; color: #8A8A93; text-transform: uppercase; margin-top: 5px;">
                      Haute Horlogerie &bull; Swiss Craftsmanship
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td class="content-padding" style="padding: 36px 36px 20px 36px; text-align: left;">
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.25em; color: #D4AF37; text-transform: uppercase; margin-bottom: 12px;">
                CONFIRMATION OF REGISTRATION
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 26px; line-height: 1.35; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0;">
                Welcome to ${storeName}, ${firstName}.
              </h1>
              <p style="font-size: 14px; line-height: 1.7; color: #C4C4CC; margin: 0 0 16px 0;">
                Thank you for registering with ${storeName}. Your personal collector portfolio has been created successfully, granting you immediate access to our vault of certified, mastercrafted luxury timepieces.
              </p>
              <p style="font-size: 14px; line-height: 1.7; color: #9A9AA4; margin: 0 0 24px 0;">
                Whether you are seeking an iconic perpetual chronograph, a classic dress complication, or a certified investment reference from manufacture houses like Rolex, Patek Philippe, Audemars Piguet, and Vacheron Constantin, your journey starts here.
              </p>

              <!-- Account Overview Card -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #14141A; border: 1px solid #262633; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #D4AF37; text-transform: uppercase; margin-bottom: 10px;">
                      Client Profile Summary
                    </div>
                    <div style="font-size: 13px; color: #FFFFFF; margin-bottom: 6px;">
                      <span style="color: #7E7E8B;">Registered Email:</span> <strong>${email}</strong>
                    </div>
                    <div style="font-size: 13px; color: #FFFFFF; margin-bottom: 6px;">
                      <span style="color: #7E7E8B;">Membership Status:</span> <span style="color: #34D399; font-weight: 600;">Verified Collector</span>
                    </div>
                    <div style="font-size: 13px; color: #FFFFFF;">
                      <span style="color: #7E7E8B;">Concierge Access:</span> Active Worldwide
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Call To Action Button -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="http://localhost:3000/shop" target="_blank" style="display: inline-block; background: linear-gradient(90deg, #D4AF37 0%, #B8860B 100%); color: #000000; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; padding: 16px 36px; border-radius: 50px; box-shadow: 0 4px 18px rgba(212, 175, 55, 0.35);">
                      EXPLORE THE TIMEPIECE VAULT &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Luxury Pillars Grid -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #1C1C24; padding-top: 24px; margin-top: 10px;">
                <tr>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 8px;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">100% Authentic</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">Original Box & Papers</div>
                  </td>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 8px; border-left: 1px solid #1F1F2A; border-right: 1px solid #1F1F2A;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">Insured Delivery</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">Worldwide Secure Transit</div>
                  </td>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 8px;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">5-Year Warranty</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">International Coverage</div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #070709; padding: 26px 36px; border-top: 1px solid #1C1C24; text-align: center;">
              <p style="font-size: 11px; color: #7A7A84; line-height: 1.6; margin: 0 0 8px 0;">
                For private consultations, acquisition inquiries, or bespoke curation, contact our concierge at <span style="color: #D4AF37;">${conciergeEmail}</span> or call <span style="color: #D4AF37;">${boutiquePhone}</span>.
              </p>
              <p style="font-size: 10px; color: #55555E; margin: 0;">
                &copy; ${currentYear} ${storeName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Generates a clean plain-text alternative of the welcome email
 */
const generateWelcomeText = (name, email, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const firstName = (name || '').trim().split(' ')[0] || 'Collector';
  const currentYear = new Date().getFullYear();

  return `WELCOME TO ${storeName.toUpperCase()}

Dear ${firstName},

Thank you for registering with ${storeName}. Your account has been created successfully.

Your personal horological portfolio has been activated, granting you direct access to our certified collection of mastercrafted luxury timepieces.

Account Overview:
- Registered Email: ${email}
- Membership: Verified Collector
- Privileges: Certified Authenticity, White-Glove Insured Delivery, 5-Year Comprehensive Warranty.
- Boutique Concierge: ${boutiquePhone}

Explore our collection:
http://localhost:3000/shop

If you have any questions or require bespoke assistance, our private horological concierge is at your service at ${conciergeEmail}.

(c) ${currentYear} ${storeName}. All rights reserved.
`;
};

/**
 * Generates a luxury black-and-gold responsive HTML order confirmation email
 * @param {Object} order - MongoDB Order document
 * @param {Object} [user] - Authenticated User document
 * @param {Object} [settings] - Store settings document
 * @returns {string} HTML email
 */
const generateOrderConfirmationHtml = (order, user = {}, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const shippingAddr = order.shippingAddress || {};
  const recipientName = (shippingAddr.fullName || user?.name || 'Valued Collector').trim();
  const firstName = recipientName.split(' ')[0] || 'Collector';
  const orderNumber = order.orderId || 'TCK-CONFIRMED';
  const orderDate = formatOrderDate(order.createdAt || new Date());
  const currentYear = new Date().getFullYear();

  // Payment status presentation (COD vs Online Payment)
  const isCod = order.paymentMethod === 'Cash on Delivery';
  const paymentMethodLabel = isCod ? 'Cash on Delivery' : (order.paymentMethod || 'Online Payment');
  const paymentStatusBadgeColor = isCod ? '#F59E0B' : '#10B981';
  const paymentStatusText = isCod ? 'Pay on Delivery (Pending)' : 'Paid (Confirmed & Verified)';
  const transactionId = order.paymentId || order.trackingNumber || orderNumber;

  // Build rows for each watch in the order
  const itemsHtml = (order.items || [])
    .map((item) => {
      const imgUrl = resolveImageUrl(item.image);
      const itemSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #1C1C24;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td width="72" valign="top" style="padding-right: 14px;">
                  <img src="${imgUrl}" alt="${item.name}" width="68" height="68" style="width: 68px; height: 68px; object-fit: cover; border-radius: 8px; border: 1px solid #2A261A; background-color: #000000; display: block;" />
                </td>
                <td valign="top" style="text-align: left;">
                  <div style="font-size: 10px; font-weight: 700; color: #D4AF37; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px;">
                    ${item.brand || 'Luxury Manufacture'}
                  </div>
                  <div style="font-family: Georgia, serif; font-size: 14px; font-weight: 700; color: #FFFFFF; line-height: 1.35; margin-bottom: 4px;">
                    ${item.name}
                  </div>
                  <div style="font-size: 12px; color: #8A8A96;">
                    Qty: <strong style="color: #E5E5E5;">${item.quantity}</strong> &times; ${formatCurrency(item.price)}
                  </div>
                </td>
                <td width="110" valign="top" style="text-align: right;">
                  <div style="font-family: Georgia, serif; font-size: 14px; font-weight: 700; color: #F3E5AB;">
                    ${formatCurrency(itemSubtotal)}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${orderNumber} | ${storeName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #08080A;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E5E5E5;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    a {
      color: #D4AF37;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 8px !important;
      }
      .content-padding {
        padding: 24px 18px !important;
      }
      .col-half {
        display: block !important;
        width: 100% !important;
        margin-bottom: 14px !important;
      }
      .column-pill {
        display: block !important;
        width: 100% !important;
        margin-bottom: 12px !important;
        border-left: none !important;
        border-right: none !important;
        border-bottom: 1px solid #1F1F2A !important;
        padding-bottom: 12px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #08080A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E5E5E5;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #08080A; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" class="container" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #0F0F13; border: 1px solid #2A261A; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 48px rgba(0,0,0,0.9);">
          
          <!-- Top Gold Accent Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #996515 0%, #D4AF37 50%, #F3E5AB 100%);"></td>
          </tr>

          <!-- Header / Brand Emblem -->
          <tr>
            <td align="center" style="padding: 34px 28px 22px 28px; border-bottom: 1px solid #1C1C24;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Brand Monogram -->
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border: 1.5px solid #D4AF37; background: #000000; text-align: center; margin-bottom: 12px;">
                      <span style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #D4AF37; letter-spacing: 2px;">T</span>
                    </div>
                    <div style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; letter-spacing: 0.35em; color: #F3E5AB; text-transform: uppercase;">
                      T I C K I N G
                    </div>
                    <div style="font-size: 9px; letter-spacing: 0.3em; color: #8A8A93; text-transform: uppercase; margin-top: 5px;">
                      Haute Horlogerie &bull; Swiss Craftsmanship
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-padding" style="padding: 34px 34px 24px 34px; text-align: left;">
              
              <!-- Category Pill -->
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.25em; color: #D4AF37; text-transform: uppercase; margin-bottom: 10px;">
                ACQUISITION CONFIRMED &bull; ORDER #${orderNumber}
              </div>

              <!-- Heading -->
              <h1 style="font-family: Georgia, serif; font-size: 25px; line-height: 1.35; font-weight: 700; color: #FFFFFF; margin: 0 0 14px 0;">
                Thank you for your order, ${firstName}.
              </h1>

              <p style="font-size: 14px; line-height: 1.7; color: #C4C4CC; margin: 0 0 22px 0;">
                Your luxury timepiece acquisition has been successfully received and confirmed. Our horological concierge team is preparing your allocation for insured, white-glove packaging and dispatch.
              </p>

              <!-- Order Overview Bar (Dark Pill) -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #14141A; border: 1px solid #262633; border-radius: 12px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" style="text-align: left;">
                          <div style="font-size: 9px; color: #7E7E8B; text-transform: uppercase; letter-spacing: 0.15em;">Order Reference</div>
                          <div style="font-size: 12px; font-weight: 700; color: #F3E5AB; margin-top: 3px;">#${orderNumber}</div>
                        </td>
                        <td width="33%" style="text-align: left; padding: 0 10px;">
                          <div style="font-size: 9px; color: #7E7E8B; text-transform: uppercase; letter-spacing: 0.15em;">Date & Time</div>
                          <div style="font-size: 12px; font-weight: 600; color: #FFFFFF; margin-top: 3px;">${orderDate}</div>
                        </td>
                        <td width="33%" style="text-align: right;">
                          <div style="font-size: 9px; color: #7E7E8B; text-transform: uppercase; letter-spacing: 0.15em;">Payment Status</div>
                          <div style="font-size: 11px; font-weight: 700; color: ${paymentStatusBadgeColor}; margin-top: 3px; text-transform: uppercase;">
                            ${isCod ? 'Pay on Delivery' : 'Paid'}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Section: Allocated Timepieces -->
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; color: #D4AF37; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #1C1C24; pb-2;">
                Allocated Timepieces (${order.items?.length || 0})
              </div>

              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                ${itemsHtml}
              </table>

              <!-- Financial Summary Ledger -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #14141A; border: 1px solid #262633; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size: 13px; color: #A0A0AB; padding-bottom: 8px;">Subtotal</td>
                        <td style="font-size: 13px; color: #FFFFFF; text-align: right; padding-bottom: 8px;">${formatCurrency(order.subtotal)}</td>
                      </tr>
                      ${
                        order.discount > 0
                          ? `
                      <tr>
                        <td style="font-size: 13px; color: #34D399; padding-bottom: 8px;">Privilege Discount ${order.couponCode ? `(${order.couponCode})` : ''}</td>
                        <td style="font-size: 13px; color: #34D399; text-align: right; padding-bottom: 8px;">-${formatCurrency(order.discount)}</td>
                      </tr>`
                          : ''
                      }
                      <tr>
                        <td style="font-size: 13px; color: #A0A0AB; padding-bottom: 8px;">White-Glove Insured Shipping</td>
                        <td style="font-size: 13px; color: #F3E5AB; text-align: right; font-weight: 600; padding-bottom: 8px;">COMPLIMENTARY</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #A0A0AB; padding-bottom: 14px;">Luxury Duty / VAT</td>
                        <td style="font-size: 13px; color: #FFFFFF; text-align: right; padding-bottom: 14px;">${formatCurrency(order.tax)}</td>
                      </tr>
                      <tr>
                        <td style="border-top: 1px solid #2A2A38; padding-top: 14px; font-size: 14px; font-weight: 700; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.1em;">
                          Final Amount ${isCod ? '(Payable on Delivery)' : 'Paid'}
                        </td>
                        <td style="border-top: 1px solid #2A2A38; padding-top: 14px; font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #F3E5AB; text-align: right;">
                          ${formatCurrency(order.grandTotal)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Two Column Customer & Payment Cards -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td class="col-half" width="48%" valign="top" style="background-color: #121217; border: 1px solid #262633; border-radius: 12px; padding: 18px 20px;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.18em; color: #D4AF37; text-transform: uppercase; margin-bottom: 10px;">
                      Delivery Destination
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
                      ${shippingAddr.fullName || recipientName}
                    </div>
                    <div style="font-size: 12px; line-height: 1.6; color: #9A9AA4;">
                      ${shippingAddr.address || ''}<br />
                      ${shippingAddr.city || ''}, ${shippingAddr.state || ''} &bull; ${shippingAddr.pincode || ''}<br />
                      <span style="color: #6C6C78;">Tel:</span> ${shippingAddr.phone || 'N/A'}
                    </div>
                  </td>

                  <td width="4%" class="col-half">&nbsp;</td>

                  <td class="col-half" width="48%" valign="top" style="background-color: #121217; border: 1px solid #262633; border-radius: 12px; padding: 18px 20px;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.18em; color: #D4AF37; text-transform: uppercase; margin-bottom: 10px;">
                      Payment Details
                    </div>
                    <div style="font-size: 13px; color: #FFFFFF; margin-bottom: 6px;">
                      <span style="color: #7E7E8B;">Method:</span> <strong>${paymentMethodLabel}</strong>
                    </div>
                    <div style="font-size: 13px; color: #FFFFFF; margin-bottom: 6px;">
                      <span style="color: #7E7E8B;">Status:</span> <span style="color: ${paymentStatusBadgeColor}; font-weight: 600;">${paymentStatusText}</span>
                    </div>
                    <div style="font-size: 11px; color: #8A8A96; word-break: break-all;">
                      <span style="color: #7E7E8B;">Reference:</span> ${transactionId}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Call to Action: View Order in Account -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 26px;">
                <tr>
                  <td align="center">
                    <a href="http://localhost:3000/orders/${order._id || order.orderId}" target="_blank" style="display: inline-block; background: linear-gradient(90deg, #D4AF37 0%, #B8860B 100%); color: #000000; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; padding: 15px 34px; border-radius: 50px; box-shadow: 0 4px 18px rgba(212, 175, 55, 0.35);">
                      VIEW ORDER IN YOUR VAULT &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Luxury Pillars Grid -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #1C1C24; padding-top: 22px; margin-top: 8px;">
                <tr>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 6px;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">100% Authentic</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">Original Box & Papers</div>
                  </td>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 6px; border-left: 1px solid #1F1F2A; border-right: 1px solid #1F1F2A;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">Insured Transit</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">White-Glove Delivery</div>
                  </td>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 6px;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">5-Year Warranty</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">Comprehensive Coverage</div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #070709; padding: 24px 34px; border-top: 1px solid #1C1C24; text-align: center;">
              <p style="font-size: 11px; color: #7A7A84; line-height: 1.6; margin: 0 0 8px 0;">
                For order concierge assistance, transit tracking, or bespoke inquiries, contact us at <span style="color: #D4AF37;">${conciergeEmail}</span> or call <span style="color: #D4AF37;">${boutiquePhone}</span>.
              </p>
              <p style="font-size: 10px; color: #55555E; margin: 0;">
                &copy; ${currentYear} ${storeName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Generates a clean plain-text alternative of the order confirmation email
 */
const generateOrderConfirmationText = (order, user = {}, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const shippingAddr = order.shippingAddress || {};
  const recipientName = (shippingAddr.fullName || user?.name || 'Valued Collector').trim();
  const firstName = recipientName.split(' ')[0] || 'Collector';
  const orderNumber = order.orderId || 'TCK-CONFIRMED';
  const orderDate = formatOrderDate(order.createdAt || new Date());
  const currentYear = new Date().getFullYear();
  const isCod = order.paymentMethod === 'Cash on Delivery';
  const paymentMethodLabel = isCod ? 'Cash on Delivery' : (order.paymentMethod || 'Online Payment');
  const paymentStatusText = isCod ? 'Pay on Delivery (Pending)' : 'Paid (Confirmed & Verified)';
  const transactionId = order.paymentId || order.trackingNumber || orderNumber;

  const itemsText = (order.items || [])
    .map((item, idx) => {
      const itemSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      return `${idx + 1}. ${item.name} (${item.brand || 'Luxury Watch'})
   Quantity: ${item.quantity} x ${formatCurrency(item.price)}
   Item Total: ${formatCurrency(itemSubtotal)}`;
    })
    .join('\n\n');

  return `ORDER CONFIRMATION - ${storeName.toUpperCase()}
Order #${orderNumber}

Dear ${firstName},

Thank you for your order. Your luxury timepiece acquisition has been confirmed and is being prepared for insured, white-glove packaging.

ORDER DETAILS:
- Order Number: #${orderNumber}
- Order Date: ${orderDate}
- Order Status: ${order.orderStatus || 'Confirmed'}
- Tracking Number: ${order.trackingNumber || 'Assigned upon dispatch'}

TIMEPIECES ALLOCATED:
${itemsText}

FINANCIAL SUMMARY:
- Subtotal: ${formatCurrency(order.subtotal)}
${order.discount > 0 ? `- Privilege Discount: -${formatCurrency(order.discount)} (${order.couponCode || 'Promo'})\n` : ''}- White-Glove Insured Shipping: COMPLIMENTARY (₹0.00)
- Luxury Duty / Tax: ${formatCurrency(order.tax)}
- Total Amount: ${formatCurrency(order.grandTotal)}

PAYMENT DETAILS:
- Payment Method: ${paymentMethodLabel}
- Payment Status: ${paymentStatusText}
- Transaction Reference: ${transactionId}

DELIVERY DESTINATION:
${shippingAddr.fullName || recipientName}
${shippingAddr.address || ''}
${shippingAddr.city || ''}, ${shippingAddr.state || ''} - ${shippingAddr.pincode || ''}
Phone: ${shippingAddr.phone || 'N/A'}

View your order online:
http://localhost:3000/orders/${order._id || order.orderId}

If you have any questions regarding your acquisition, contact our horological concierge at ${conciergeEmail} or call ${boutiquePhone}.

(c) ${currentYear} ${storeName}. All rights reserved.
`;
};

/**
 * Sends a welcome/registration confirmation email using the Brevo API
 */
const sendRegistrationWelcomeEmail = async ({ name, email }) => {
  let settings = null;
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      settings = await Settings.getSingleton();
    }
  } catch (err) {
    console.warn('[Brevo Email] Could not fetch settings, using defaults:', err.message);
  }

  const { storeName } = getSafeSettings(settings);
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim();
  const senderName = (process.env.BREVO_SENDER_NAME || storeName).trim();

  // 1. Verify credentials configuration
  if (!apiKey || !senderEmail) {
    console.warn(
      '[Brevo Email] Configuration notice: BREVO_API_KEY or BREVO_SENDER_EMAIL is not set in backend/.env. Welcome email skipped.'
    );
    return {
      success: false,
      skipped: true,
      reason: 'Brevo credentials not configured in backend/.env'
    };
  }

  // 2. Dispatch email via Brevo API
  try {
    const client = new BrevoClient({ apiKey });

    const payload = {
      subject: `Welcome to ${storeName} | Your Account is Ready`,
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: email.toLowerCase().trim(),
          name: name ? name.trim() : 'Valued Collector'
        }
      ],
      htmlContent: generateWelcomeHtml(name, email, settings),
      textContent: generateWelcomeText(name, email, settings)
    };

    const response = await client.transactionalEmails.sendTransacEmail(payload);

    console.log(
      `[Brevo Email] Welcome email successfully sent to ${email} (Message ID: ${response?.messageId || 'dispatched'})`
    );

    return {
      success: true,
      messageId: response?.messageId
    };
  } catch (error) {
    const errorMessage =
      error?.response?.body?.message ||
      error?.body?.message ||
      error?.message ||
      'Unknown error during Brevo API request';
    const statusCode = error?.statusCode || error?.status || 'N/A';

    console.error(
      `[Brevo Email] Delivery failed for ${email} [Status: ${statusCode}]: ${errorMessage}`
    );

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Sends an order confirmation transactional email via the Brevo API
 *
 * @param {Object} params
 * @param {Object} params.order - Order document or object from MongoDB
 * @param {Object} [params.user] - Associated User document or object
 * @returns {Promise<{ success: boolean, messageId?: string, skipped?: boolean, reason?: string, error?: string }>}
 */
const sendOrderConfirmationEmail = async ({ order, user }) => {
  if (!order) {
    return { success: false, reason: 'No order provided' };
  }

  // 1. Deduplication check: do not send duplicate confirmation emails for the same order
  if (order.confirmationEmailSent) {
    console.log(`[Brevo Email] Order confirmation email already sent for #${order.orderId || order._id}. Skipping.`);
    return {
      success: true,
      skipped: true,
      reason: 'Order confirmation email already dispatched previously'
    };
  }

  // 2. Payment verification check:
  // For online payments, send only if verified/paid. If marked failed, skip.
  if (order.paymentMethod === 'Online Payment' && order.paymentStatus === 'Failed') {
    console.log(`[Brevo Email] Order #${order.orderId} online payment failed. Confirmation email skipped.`);
    return {
      success: false,
      skipped: true,
      reason: 'Online payment status is Failed'
    };
  }

  // 3. Resolve recipient email
  const recipientEmail = (
    order.shippingAddress?.email ||
    user?.email ||
    ''
  ).toLowerCase().trim();

  const recipientName = (
    order.shippingAddress?.fullName ||
    user?.name ||
    'Valued Collector'
  ).trim();

  if (!recipientEmail) {
    console.warn(`[Brevo Email] No valid recipient email address for order #${order.orderId || order._id}. Email skipped.`);
    return {
      success: false,
      skipped: true,
      reason: 'No recipient email address found'
    };
  }

  // 4. Retrieve store settings safely
  let settings = null;
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      settings = await Settings.getSingleton();
    }
  } catch (err) {
    console.warn('[Brevo Email] Could not fetch settings, using defaults:', err.message);
  }

  const { storeName } = getSafeSettings(settings);
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim();
  const senderName = (process.env.BREVO_SENDER_NAME || storeName).trim();

  // 5. Verify credentials configuration
  if (!apiKey || !senderEmail) {
    console.warn(
      `[Brevo Email] Configuration notice: BREVO_API_KEY or BREVO_SENDER_EMAIL is not set in backend/.env. Order #${order.orderId} confirmation email skipped.`
    );
    return {
      success: false,
      skipped: true,
      reason: 'Brevo credentials not configured in backend/.env'
    };
  }

  // 6. Dispatch email via Brevo API
  try {
    const client = new BrevoClient({ apiKey });

    const payload = {
      subject: `Order Confirmed #${order.orderId || ''} | ${storeName}`,
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: recipientEmail,
          name: recipientName
        }
      ],
      htmlContent: generateOrderConfirmationHtml(order, user, settings),
      textContent: generateOrderConfirmationText(order, user, settings)
    };

    const response = await client.transactionalEmails.sendTransacEmail(payload);

    console.log(
      `[Brevo Email] Order confirmation email successfully sent for #${order.orderId} to ${recipientEmail} (Message ID: ${response?.messageId || 'dispatched'})`
    );

    // 7. Update confirmationEmailSent flag in MongoDB to prevent duplicate emails
    try {
      const mongoose = require('mongoose');
      const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

      if (isDbConnected) {
        if (typeof order.save === 'function') {
          order.confirmationEmailSent = true;
          order.confirmationEmailSentAt = new Date();
          await order.save();
        } else if (order._id) {
          const Order = require('../models/Order');
          await Order.findByIdAndUpdate(order._id, {
            confirmationEmailSent: true,
            confirmationEmailSentAt: new Date()
          });
        }
      } else {
        order.confirmationEmailSent = true;
        order.confirmationEmailSentAt = new Date();
      }
    } catch (saveErr) {
      console.warn('[Brevo Email] Notice: could not persist confirmationEmailSent status on order:', saveErr.message);
    }

    return {
      success: true,
      messageId: response?.messageId
    };
  } catch (error) {
    const errorMessage =
      error?.response?.body?.message ||
      error?.body?.message ||
      error?.message ||
      'Unknown error during Brevo API request';
    const statusCode = error?.statusCode || error?.status || 'N/A';

    console.error(
      `[Brevo Email] Order confirmation email delivery failed for #${order.orderId} (${recipientEmail}) [Status: ${statusCode}]: ${errorMessage}`
    );

    // Never throw or fail the order; return graceful error result
    return {
      success: false,
      error: errorMessage
    };
  }
};

module.exports = {
  sendRegistrationWelcomeEmail,
  sendOrderConfirmationEmail,
  generateWelcomeHtml,
  generateWelcomeText,
  generateOrderConfirmationHtml,
  generateOrderConfirmationText
};
