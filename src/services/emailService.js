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
 * Cloudinary Delivery URLs for all 13 TICKING Luxury Watch Assets
 */
const CLOUDINARY_IMAGE_MAP = {
  datejust: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843446/datejust.jpg',
  daytona: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/daytona.jpg',
  submariner: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843445/submariner.jpg',
  nautilus: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/nautilus.jpg',
  overseas: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843444/overseas.jpg',
  santos: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843444/santos.jpg',
  speedmaster: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843444/speedmaster.jpg',
  navitimer: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843443/navitimer.jpg',
  lange_1815: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/lange_1815.jpg',
  ap_diver: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843446/ap_diver.jpg',
  hero_chronograph: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/hero_chronograph.jpg',
  movement_craft: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843443/movement_craft.jpg',
  tag_connected: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843445/tag_connected.jpg'
};

/**
 * Resolves watch images to valid, accessible HTTPS Cloudinary URLs for email clients.
 * - Always delivers complete, publicly accessible HTTPS URLs.
 * - Intelligently matches direct Cloudinary links, local filenames, or watch model names.
 * - Never returns broken localhost or relative URLs.
 * - Luxury fallback guaranteed.
 */
const resolveImageUrl = (imgUrl, watchName = '') => {
  if (imgUrl && typeof imgUrl === 'string') {
    const trimmed = imgUrl.trim();

    // If already a valid public Cloudinary HTTPS delivery URL
    if (trimmed.startsWith('https://res.cloudinary.com/')) {
      return trimmed;
    }

    // Check if filename contains any key in CLOUDINARY_IMAGE_MAP
    const lower = trimmed.toLowerCase();
    for (const [key, cUrl] of Object.entries(CLOUDINARY_IMAGE_MAP)) {
      if (lower.includes(key)) {
        return cUrl;
      }
    }

    // If any other valid public HTTPS URL (excluding localhost / 127.0.0.1)
    if (trimmed.startsWith('https://') && !trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
      return trimmed;
    }
  }

  // Fallback: match by watch model name if available
  if (watchName && typeof watchName === 'string') {
    const nameLower = watchName.toLowerCase();
    if (nameLower.includes('datejust')) return CLOUDINARY_IMAGE_MAP.datejust;
    if (nameLower.includes('daytona')) return CLOUDINARY_IMAGE_MAP.daytona;
    if (nameLower.includes('submariner')) return CLOUDINARY_IMAGE_MAP.submariner;
    if (nameLower.includes('nautilus')) return CLOUDINARY_IMAGE_MAP.nautilus;
    if (nameLower.includes('overseas')) return CLOUDINARY_IMAGE_MAP.overseas;
    if (nameLower.includes('santos')) return CLOUDINARY_IMAGE_MAP.santos;
    if (nameLower.includes('speedmaster') || nameLower.includes('moonwatch')) return CLOUDINARY_IMAGE_MAP.speedmaster;
    if (nameLower.includes('navitimer')) return CLOUDINARY_IMAGE_MAP.navitimer;
    if (nameLower.includes('1815') || nameLower.includes('lange')) return CLOUDINARY_IMAGE_MAP.lange_1815;
    if (nameLower.includes('diver') || nameLower.includes('offshore') || nameLower.includes('royal oak')) return CLOUDINARY_IMAGE_MAP.ap_diver;
    if (nameLower.includes('portugieser') || nameLower.includes('iwc')) return CLOUDINARY_IMAGE_MAP.hero_chronograph;
    if (nameLower.includes('connected') || nameLower.includes('tag')) return CLOUDINARY_IMAGE_MAP.tag_connected;
  }

  // Safe default: luxury hero chronograph photo on Cloudinary
  return CLOUDINARY_IMAGE_MAP.hero_chronograph;
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
  const paymentStatusText = isCod ? 'Pending' : 'Paid';
  const paymentStatusNote = isCod ? 'Pay on Delivery' : 'Verified via Razorpay';
  const transactionId = order.paymentId || order.trackingNumber || orderNumber;

  // Calculate estimated delivery date (3–5 business days)
  const calcEstimatedDelivery = (dateInput) => {
    const d = new Date(dateInput || Date.now());
    d.setDate(d.getDate() + 4);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  const estimatedDeliveryDate = calcEstimatedDelivery(order.createdAt || new Date());

  // Build rows for each watch in the order (clean luxury typography without product images)
  const itemsHtml = (order.items || [])
    .map((item) => {
      const itemSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #1C1C24;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
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
                <td width="120" valign="top" style="text-align: right;">
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
                            ${paymentStatusText}
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
                    <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #1E1E28; font-size: 11px;">
                      <span style="color: #7E7E8B; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 2px;">Estimated Delivery</span>
                      <strong style="color: #F3E5AB;">${estimatedDeliveryDate}</strong>
                      <span style="color: #8A8A96; display: block; margin-top: 1px;">(3–5 Business Days &bull; White-Glove Insured Transit)</span>
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
                      <span style="color: #7E7E8B;">Status:</span> <strong style="color: ${paymentStatusBadgeColor};">${paymentStatusText}</strong> <span style="font-size: 11px; color: #8A8A96;">(${paymentStatusNote})</span>
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
                    <a href="${(process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '')}/orders/${order._id || order.orderId}" target="_blank" style="display: inline-block; background: linear-gradient(90deg, #D4AF37 0%, #B8860B 100%); color: #000000; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; padding: 15px 34px; border-radius: 50px; box-shadow: 0 4px 18px rgba(212, 175, 55, 0.35);">
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
  const paymentStatusText = isCod ? 'Pending' : 'Paid';
  const paymentStatusNote = isCod ? 'Pay on Delivery' : 'Verified via Razorpay';
  const transactionId = order.paymentId || order.trackingNumber || orderNumber;

  const calcEstimatedDelivery = (dateInput) => {
    const d = new Date(dateInput || Date.now());
    d.setDate(d.getDate() + 4);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  const estimatedDeliveryDate = calcEstimatedDelivery(order.createdAt || new Date());

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
- Total Order Amount: ${formatCurrency(order.grandTotal)}

PAYMENT DETAILS:
- Payment Method: ${paymentMethodLabel}
- Payment Status: ${paymentStatusText} (${paymentStatusNote})
- Transaction Reference: ${transactionId}

DELIVERY DESTINATION:
${shippingAddr.fullName || recipientName}
${shippingAddr.address || ''}
${shippingAddr.city || ''}, ${shippingAddr.state || ''} - ${shippingAddr.pincode || ''}
Phone: ${shippingAddr.phone || 'N/A'}
Estimated Delivery: ${estimatedDeliveryDate} (3-5 Business Days)

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
  // For online payments, send only after backend verification succeeds (order.paymentStatus === 'Paid').
  // For Cash on Delivery orders, send immediately upon order creation without waiting for payment.
  if (order.paymentMethod === 'Online Payment' && order.paymentStatus !== 'Paid') {
    console.log(`[Brevo Email] Order #${order.orderId} online payment is not verified as Paid (Status: ${order.paymentStatus}). Confirmation email skipped.`);
    return {
      success: false,
      skipped: true,
      reason: 'Online payment has not been verified as Paid'
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
    const isCod = order.paymentMethod === 'Cash on Delivery';

    const payload = {
      subject: isCod
        ? `Order Confirmed #${order.orderId || ''} (Cash on Delivery) | ${storeName}`
        : `Order Confirmed #${order.orderId || ''} (Payment Successful) | ${storeName}`,
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

    // 7. Update confirmationEmailSent flag in MongoDB Atlas to prevent duplicate emails
    try {
      const Order = require('../models/Order');
      if (order._id) {
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            confirmationEmailSent: true,
            confirmationEmailSentAt: new Date()
          }
        });
      }
      order.confirmationEmailSent = true;
      order.confirmationEmailSentAt = new Date();
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

/**
 * Generates a luxury black-and-gold responsive HTML account deleted email for TICKING
 */
const generateAccountDeletedHtml = (name, email, deletionDate, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const firstName = (name || '').trim().split(' ')[0] || 'Collector';
  const currentYear = new Date().getFullYear();
  const formattedDate = formatOrderDate(deletionDate || new Date());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deleted Successfully | ${storeName}</title>
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
            <td class="content-padding" style="padding: 36px 36px 24px 36px; text-align: left;">
              <!-- Status Pill -->
              <div style="display: inline-block; padding: 4px 12px; background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #F87171; text-transform: uppercase; margin-bottom: 14px;">
                CONFIRMATION OF ACCOUNT DELETION
              </div>

              <h1 style="font-family: Georgia, serif; font-size: 24px; line-height: 1.35; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0;">
                Account Deleted Successfully
              </h1>

              <p style="font-size: 14px; line-height: 1.7; color: #C4C4CC; margin: 0 0 16px 0;">
                Dear ${firstName},
              </p>

              <p style="font-size: 14px; line-height: 1.7; color: #C4C4CC; margin: 0 0 20px 0;">
                We are writing to confirm that your <strong>${storeName}</strong> client account has been permanently deleted from our system as per your request.
              </p>

              <!-- Deletion Details Card -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #14141A; border: 1px solid #262633; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #D4AF37; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #1F1F2A; padding-bottom: 8px;">
                      Account Deletion Details
                    </div>
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8A8A93;">Account Email:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #FFFFFF; text-align: right; font-weight: 600;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8A8A93;">Deletion Date:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #FFFFFF; text-align: right; font-weight: 600;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8A8A93;">Account Status:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #F87171; text-align: right; font-weight: 600;">Permanently Deleted</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Explanation Notice -->
              <div style="background-color: #101016; border-left: 3px solid #D4AF37; padding: 14px 18px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                <p style="font-size: 12px; line-height: 1.6; color: #9A9AA4; margin: 0;">
                  Your profile credentials, delivery addresses, personal preferences, and wishlists have been completely erased from our active databases. In accordance with legal, warranty, and tax compliance regulations, historical transaction records and invoices remain securely archived in our private financial ledgers.
                </p>
              </div>

              <p style="font-size: 13px; line-height: 1.7; color: #9A9AA4; margin: 0 0 20px 0;">
                We thank you for the privilege of serving your horological journey. Should you ever wish to explore handcrafted timepieces with us again, you are always welcome to create a new portfolio.
              </p>

              <!-- Concierge support callout -->
              <p style="font-size: 12px; color: #7E7E8B; margin: 0;">
                If you did not initiate this request or have immediate questions, please contact our concierge immediately at <a href="mailto:${conciergeEmail}" style="color: #D4AF37;">${conciergeEmail}</a>.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #070709; padding: 26px 36px; border-top: 1px solid #1C1C24; text-align: center;">
              <p style="font-size: 11px; color: #7A7A84; line-height: 1.6; margin: 0 0 8px 0;">
                Boutique Inquiries: <span style="color: #D4AF37;">${conciergeEmail}</span> &bull; <span style="color: #D4AF37;">${boutiquePhone}</span>
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
 * Plain text fallback for account deleted email
 */
const generateAccountDeletedText = (name, email, deletionDate, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const formattedDate = formatOrderDate(deletionDate || new Date());

  return `ACCOUNT DELETED SUCCESSFULLY - ${storeName}

Dear ${name || 'Collector'},

We confirm that your ${storeName} account has been permanently deleted as per your request.

ACCOUNT DELETION DETAILS:
- Account Email: ${email}
- Deletion Date: ${formattedDate}
- Account Status: Permanently Deleted

Your profile credentials, delivery addresses, and wishlists have been completely erased from our active databases. Any historical purchase invoices required for legal and tax compliance remain preserved in our confidential ledgers.

If you have questions or need assistance, please contact our concierge at ${conciergeEmail} or ${boutiquePhone}.

Best regards,
The ${storeName} Concierge Team
`;
};

/**
 * Sends an Account Deleted Successfully email via Brevo
 */
const sendAccountDeletedEmail = async ({ name, email, deletionDate }) => {
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

  if (!apiKey || !senderEmail) {
    console.warn(
      '[Brevo Email] Configuration notice: BREVO_API_KEY or BREVO_SENDER_EMAIL is not set in backend/.env. Account deletion email skipped.'
    );
    return {
      success: false,
      skipped: true,
      reason: 'Brevo credentials not configured in backend/.env'
    };
  }

  try {
    const client = new BrevoClient({ apiKey });

    const payload = {
      subject: `Account Deleted Successfully | ${storeName}`,
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
      htmlContent: generateAccountDeletedHtml(name, email, deletionDate, settings),
      textContent: generateAccountDeletedText(name, email, deletionDate, settings)
    };

    const response = await client.transactionalEmails.sendTransacEmail(payload);

    console.log(
      `[Brevo Email] Account deletion confirmation email successfully sent to ${email} (Message ID: ${response?.messageId || 'dispatched'})`
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
      `[Brevo Email] Account deletion email delivery failed for ${email} [Status: ${statusCode}]: ${errorMessage}`
    );

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Generates a luxury black-and-gold responsive HTML password reset OTP verification email
 */
const generatePasswordResetOtpHtml = (name, otpCode, expiresInMinutes = 5, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const firstName = (name || '').trim().split(' ')[0] || 'Valued Collector';
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code | ${storeName}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #08080A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E5E5E5; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    a { color: #D4AF37; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .content-padding { padding: 25px 20px !important; }
      .otp-box { font-size: 32px !important; letter-spacing: 0.25em !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #08080A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E5E5E5;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #08080A; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0F0F13; border: 1px solid #2A261A; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.85);">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #996515 0%, #D4AF37 50%, #F3E5AB 100%);"></td>
          </tr>
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
          <tr>
            <td class="content-padding" style="padding: 36px 36px 24px 36px; text-align: left;">
              <div style="display: inline-block; padding: 4px 12px; background-color: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #D4AF37; text-transform: uppercase; margin-bottom: 14px;">
                SECURITY VERIFICATION CODE
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0; letter-spacing: 0.02em;">
                Reset Your Password
              </h1>
              <p style="font-size: 13px; line-height: 1.7; color: #B0B0B8; margin: 0 0 20px 0;">
                Dear ${firstName}, we received a request to reset the password for your TICKING luxury account. Use the following 6-digit verification code to authenticate your request:
              </p>
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background: #08080A; border: 1.5px dashed #D4AF37; border-radius: 12px; padding: 26px 20px;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.25em; color: #D4AF37; text-transform: uppercase; margin-bottom: 8px;">
                      YOUR 6-DIGIT VERIFICATION CODE
                    </div>
                    <div class="otp-box" style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 800; letter-spacing: 0.35em; color: #F3E5AB; text-shadow: 0 0 15px rgba(212, 175, 55, 0.4);">
                      ${otpCode}
                    </div>
                    <div style="font-size: 11px; color: #8A8A93; margin-top: 10px;">
                      Expires in <strong style="color: #F87171;">${expiresInMinutes} minutes</strong>
                    </div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #14141A; border-left: 3px solid #D4AF37; border-radius: 4px; padding: 14px 18px; margin: 20px 0 25px 0;">
                <tr>
                  <td>
                    <p style="font-size: 12px; line-height: 1.6; color: #D1D1D6; margin: 0;">
                      <strong style="color: #F3E5AB;">Security Note:</strong> Never share this verification code with anyone. TICKING concierges will never ask you for your code. If you did not initiate this request, your account remains secure and no action is required.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; line-height: 1.6; color: #8A8A93; margin: 0;">
                Warm regards,<br>
                <strong style="color: #D4AF37;">The TICKING Private Security & Concierge Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0A0A0D; border-top: 1px solid #1C1C24; padding: 24px 30px; text-align: center;">
              <p style="font-size: 11px; color: #6E6E78; margin: 0 0 8px 0;">
                Need assistance? Contact our private desk:
                <a href="mailto:${conciergeEmail}" style="color: #D4AF37;">${conciergeEmail}</a> &bull;
                <a href="tel:${boutiquePhone}" style="color: #D4AF37;">${boutiquePhone}</a>
              </p>
              <p style="font-size: 10px; color: #505058; margin: 0;">
                &copy; ${currentYear} ${storeName}. Geneva &bull; Paris &bull; London &bull; Mumbai. All rights reserved.
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
 * Plaintext fallback for password reset verification code email
 */
const generatePasswordResetOtpText = (name, otpCode, expiresInMinutes = 5, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail } = getSafeSettings(settings);
  const firstName = (name || '').trim().split(' ')[0] || 'Valued Collector';
  return `TICKING LUXURY WATCH - PASSWORD RESET CODE

Dear ${firstName},

Your 6-digit verification code to reset your account password is:

${otpCode}

This code will expire in ${expiresInMinutes} minutes.

If you did not request this code, please disregard this email. Your account remains secure.

Concierge Desk: ${conciergeEmail}
(c) ${new Date().getFullYear()} ${storeName}. All rights reserved.`;
};

/**
 * Dispatches the 6-digit password reset verification code via Brevo
 */
const sendPasswordResetOtpEmail = async ({ name, email, otpCode, expiresInMinutes = 5 }) => {
  try {
    const apiKey = (process.env.BREVO_API_KEY || '').trim();
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim();

    if (!apiKey || !senderEmail) {
      console.warn(
        `[Brevo Email] BREVO_API_KEY or BREVO_SENDER_EMAIL is missing in backend/.env. Password reset email skipped for ${email}.`
      );
      return {
        success: false,
        skipped: true,
        reason: 'Brevo API credentials missing'
      };
    }

    let settings = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        settings = await Settings.getSingleton();
      }
    } catch {
      // defaults
    }

    const { storeName } = getSafeSettings(settings);
    const senderName = (process.env.BREVO_SENDER_NAME || storeName).trim();

    const client = new BrevoClient({ apiKey });

    const payload = {
      subject: `Your Verification Code: ${otpCode} | ${storeName}`,
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: email.toLowerCase().trim(),
          name: name || 'Valued Collector'
        }
      ],
      htmlContent: generatePasswordResetOtpHtml(name, otpCode, expiresInMinutes, settings),
      textContent: generatePasswordResetOtpText(name, otpCode, expiresInMinutes, settings)
    };

    const response = await client.transactionalEmails.sendTransacEmail(payload);

    console.log(
      `[Brevo Email] Password reset verification code successfully sent to ${email} (Message ID: ${response?.messageId || 'dispatched'})`
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
    console.error(`[Brevo Email] Password reset code email delivery failed for ${email}: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Dispatches a notification email confirming password reset
 */
const sendPasswordResetSuccessEmail = async ({ name, email }) => {
  try {
    const apiKey = (process.env.BREVO_API_KEY || '').trim();
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim();

    if (!apiKey || !senderEmail) {
      return { success: false, skipped: true };
    }

    let settings = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        settings = await Settings.getSingleton();
      }
    } catch {
      // defaults
    }

    const { storeName, supportEmail: conciergeEmail } = getSafeSettings(settings);
    const senderName = (process.env.BREVO_SENDER_NAME || storeName).trim();
    const firstName = (name || '').trim().split(' ')[0] || 'Valued Collector';

    const client = new BrevoClient({ apiKey });

    const htmlContent = `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #08080A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E5E5E5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #0F0F13; border: 1px solid #2A261A; border-radius: 16px; overflow: hidden;">
          <tr><td style="height: 4px; background: linear-gradient(90deg, #996515 0%, #D4AF37 50%, #F3E5AB 100%);"></td></tr>
          <tr>
            <td style="padding: 36px;">
              <h2 style="font-family: Georgia, serif; color: #FFFFFF; margin-top: 0;">Password Updated Successfully</h2>
              <p style="font-size: 13px; color: #B0B0B8; line-height: 1.7;">
                Dear ${firstName}, the password for your TICKING luxury account has been successfully updated.
              </p>
              <p style="font-size: 12px; color: #8A8A93; line-height: 1.6;">
                If you did not authorize this change, please contact our private concierge immediately at <a href="mailto:${conciergeEmail}" style="color: #D4AF37;">${conciergeEmail}</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await client.transactionalEmails.sendTransacEmail({
      subject: `Security Alert: Password Updated Successfully | ${storeName}`,
      sender: { name: senderName, email: senderEmail },
      to: [{ email: email.toLowerCase().trim(), name: name || 'Valued Collector' }],
      htmlContent,
      textContent: `Your TICKING account password has been updated successfully. If you did not make this change, please contact ${conciergeEmail} immediately.`
    });

    return { success: true };
  } catch (error) {
    console.error(`[Brevo Email] Password reset confirmation notice delivery error for ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Generates a luxury black-and-gold responsive HTML payment success email for TICKING
 */
const generatePaymentSuccessHtml = (order, user = {}, paymentDetails = {}, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const shippingAddr = order.shippingAddress || {};
  const recipientName = (shippingAddr.fullName || user?.name || 'Valued Collector').trim();
  const firstName = recipientName.split(' ')[0] || 'Collector';
  const orderNumber = order.orderId || 'TCK-PAID';
  const paymentDate = formatOrderDate(order.paymentSuccessEmailSentAt || order.createdAt || new Date());
  const currentYear = new Date().getFullYear();
  const razorpayPaymentId = paymentDetails?.razorpayPaymentId || order.paymentId || 'Verified';
  const paymentMethodLabel = paymentDetails?.paymentMethod || order.paymentMethod || 'Razorpay Online Card Payment';
  const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');

  const itemsHtml = (order.items || [])
    .map((item) => {
      const itemSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #1C1C24;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
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
                <td width="120" valign="top" style="text-align: right;">
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
  <title>Payment Successful #${orderNumber} | ${storeName}</title>
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
              
              <!-- Payment Success Badge Pill -->
              <div style="display: inline-block; background-color: #064E3B; border: 1px solid #059669; border-radius: 50px; padding: 6px 14px; margin-bottom: 16px;">
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; color: #34D399; text-transform: uppercase;">
                  &#10003; PAYMENT SUCCESSFUL &bull; VERIFIED VIA RAZORPAY
                </span>
              </div>

              <!-- Heading -->
              <h1 style="font-family: Georgia, serif; font-size: 24px; line-height: 1.35; font-weight: 700; color: #FFFFFF; margin: 0 0 14px 0;">
                Payment Confirmed, ${firstName}.
              </h1>

              <p style="font-size: 14px; line-height: 1.7; color: #C4C4CC; margin: 0 0 22px 0;">
                We have successfully verified your online payment for Order <strong style="color: #F3E5AB;">#${orderNumber}</strong>. Your luxury timepiece acquisition has been confirmed and scheduled for white-glove transit preparation.
              </p>

              <!-- Payment Verification Overview Ledger -->
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
                          <div style="font-size: 9px; color: #7E7E8B; text-transform: uppercase; letter-spacing: 0.15em;">Payment Date & Time</div>
                          <div style="font-size: 12px; font-weight: 600; color: #FFFFFF; margin-top: 3px;">${paymentDate}</div>
                        </td>
                        <td width="33%" style="text-align: right;">
                          <div style="font-size: 9px; color: #7E7E8B; text-transform: uppercase; letter-spacing: 0.15em;">Payment Status</div>
                          <div style="font-size: 11px; font-weight: 700; color: #10B981; margin-top: 3px; text-transform: uppercase;">
                            Successful
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Section: Acquired Timepieces -->
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; color: #D4AF37; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #1C1C24; padding-bottom: 6px;">
                Acquired Timepieces (${order.items?.length || 0})
              </div>

              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                ${itemsHtml}
              </table>

              <!-- Financial Summary Ledger -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #14141A; border: 1px solid #262633; border-radius: 12px; margin-bottom: 26px;">
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
                          Total Amount Paid
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
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 26px;">
                <tr>
                  <td class="col-half" width="48%" valign="top" style="background-color: #121217; border: 1px solid #262633; border-radius: 12px; padding: 18px 20px;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.18em; color: #D4AF37; text-transform: uppercase; margin-bottom: 10px;">
                      Delivery Address
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
                      ${shippingAddr.fullName || recipientName}
                    </div>
                    <div style="font-size: 12px; line-height: 1.6; color: #9A9AA4;">
                      ${shippingAddr.address || ''}<br />
                      ${shippingAddr.city || ''}, ${shippingAddr.state || ''} &bull; ${shippingAddr.pincode || ''}<br />
                      <span style="color: #6C6C78;">Tel:</span> ${shippingAddr.phone || 'N/A'}
                    </div>
                    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #1E1E28; font-size: 11px; color: #D4AF37;">
                      Estimated Transit: 3–5 Business Days
                    </div>
                  </td>

                  <td width="4%" class="col-half">&nbsp;</td>

                  <td class="col-half" width="48%" valign="top" style="background-color: #121217; border: 1px solid #262633; border-radius: 12px; padding: 18px 20px;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.18em; color: #D4AF37; text-transform: uppercase; margin-bottom: 10px;">
                      Payment Verification
                    </div>
                    <div style="font-size: 13px; color: #FFFFFF; margin-bottom: 6px;">
                      <span style="color: #7E7E8B;">Payment Status:</span> <strong style="color: #10B981;">Successful</strong>
                    </div>
                    <div style="font-size: 13px; color: #FFFFFF; margin-bottom: 6px;">
                      <span style="color: #7E7E8B;">Payment Method:</span> <strong>${paymentMethodLabel}</strong>
                    </div>
                    <div style="font-size: 11px; color: #8A8A96; word-break: break-all; margin-bottom: 4px;">
                      <span style="color: #7E7E8B;">Razorpay Payment ID:</span><br />
                      <strong style="color: #F3E5AB; font-family: monospace;">${razorpayPaymentId}</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 26px;">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/orders/${order._id || order.orderId}" target="_blank" style="display: inline-block; background: linear-gradient(90deg, #D4AF37 0%, #B8860B 100%); color: #000000; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; padding: 15px 34px; border-radius: 50px; box-shadow: 0 4px 18px rgba(212, 175, 55, 0.35);">
                      VIEW ORDER IN YOUR VAULT &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Trust Pillars -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #1C1C24; padding-top: 22px; margin-top: 8px;">
                <tr>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 6px;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">100% Authentic</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">Original Box & Papers</div>
                  </td>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 6px; border-left: 1px solid #1F1F2A; border-right: 1px solid #1F1F2A;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">Insured Transit</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">White-Glove Courier</div>
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
                For private concierge assistance, payment inquiries, or transit queries, please contact <span style="color: #D4AF37;">${conciergeEmail}</span> or call <span style="color: #D4AF37;">${boutiquePhone}</span>.
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
 * Generates clean plain text alternative for payment success email
 */
const generatePaymentSuccessText = (order, user = {}, paymentDetails = {}, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const shippingAddr = order.shippingAddress || {};
  const recipientName = (shippingAddr.fullName || user?.name || 'Valued Collector').trim();
  const firstName = recipientName.split(' ')[0] || 'Collector';
  const orderNumber = order.orderId || 'TCK-PAID';
  const paymentDate = formatOrderDate(order.paymentSuccessEmailSentAt || order.createdAt || new Date());
  const currentYear = new Date().getFullYear();
  const razorpayPaymentId = paymentDetails?.razorpayPaymentId || order.paymentId || 'Verified';
  const paymentMethodLabel = paymentDetails?.paymentMethod || order.paymentMethod || 'Razorpay Online Card Payment';

  const itemsText = (order.items || [])
    .map((item, idx) => `  ${idx + 1}. ${item.name} (${item.brand || 'Luxury Watch'})\n     Qty: ${item.quantity} | Unit Price: ${formatCurrency(item.price)} | Total: ${formatCurrency(item.price * item.quantity)}`)
    .join('\n\n');

  return `
================================================================================
                    T I C K I N G   L U X U R Y   W A T C H
                     Haute Horlogerie - Swiss Craftsmanship
================================================================================

PAYMENT SUCCESSFUL - ORDER CONFIRMATION
Order Reference: #${orderNumber}
Payment Status: SUCCESSFUL (Verified via Razorpay)
Date & Time: ${paymentDate}

Dear ${firstName},

Thank you for your payment. Your online card payment for Order #${orderNumber} has been verified and confirmed. Your timepiece acquisition is now reserved in our vaults.

ACQUIRED TIMEPIECES:
--------------------------------------------------------------------------------
${itemsText}
--------------------------------------------------------------------------------

FINANCIAL SUMMARY:
- Subtotal: ${formatCurrency(order.subtotal)}
${order.discount > 0 ? `- Privilege Discount: -${formatCurrency(order.discount)}\n` : ''}- White-Glove Insured Shipping: COMPLIMENTARY
- Luxury Duty / Tax: ${formatCurrency(order.tax)}
--------------------------------------------------------------------------------
TOTAL AMOUNT PAID: ${formatCurrency(order.grandTotal)}
--------------------------------------------------------------------------------

PAYMENT & VERIFICATION DETAILS:
- Payment Method: ${paymentMethodLabel}
- Payment Status: Successful
- Razorpay Payment ID: ${razorpayPaymentId}

DELIVERY DESTINATION:
${shippingAddr.fullName || recipientName}
${shippingAddr.address || ''}
${shippingAddr.city || ''}, ${shippingAddr.state || ''} - ${shippingAddr.pincode || ''}
Phone: ${shippingAddr.phone || 'N/A'}
Estimated Transit: 3-5 Business Days

For concierge support or inquiries, please reach out to ${conciergeEmail} or call ${boutiquePhone}.

(c) ${currentYear} ${storeName}. All rights reserved.
`;
};

/**
 * Sends a Payment Successful confirmation email via Brevo
 */
const sendPaymentSuccessEmail = async ({ order, user, paymentDetails = {} }) => {
  if (!order) {
    return { success: false, reason: 'No order provided' };
  }

  // 1. Idempotency check: Do not send duplicate payment success emails
  if (order.paymentSuccessEmailSent) {
    console.log(`[Brevo Email] Payment success email already sent for #${order.orderId || order._id}. Skipping.`);
    return {
      success: true,
      skipped: true,
      reason: 'Payment success email already dispatched previously'
    };
  }

  // 2. Verification check: Payment must be Paid
  if (order.paymentStatus !== 'Paid') {
    console.log(`[Brevo Email] Order #${order.orderId} payment status is not Paid (${order.paymentStatus}). Payment email skipped.`);
    return {
      success: false,
      skipped: true,
      reason: 'Order payment status is not Paid'
    };
  }

  // Do not send for Cash on Delivery unless paid
  if (order.paymentMethod === 'Cash on Delivery' && order.paymentStatus !== 'Paid') {
    console.log(`[Brevo Email] COD order #${order.orderId} is unpaid. Payment email skipped.`);
    return {
      success: false,
      skipped: true,
      reason: 'COD order is unpaid'
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

  if (!apiKey || !senderEmail) {
    console.warn(
      `[Brevo Email] Configuration notice: BREVO_API_KEY or BREVO_SENDER_EMAIL is not set in backend/.env. Order #${order.orderId} payment email skipped.`
    );
    return {
      success: false,
      skipped: true,
      reason: 'Brevo credentials not configured in backend/.env'
    };
  }

  try {
    const client = new BrevoClient({ apiKey });

    const payload = {
      subject: `Payment Successful – TICKING LUXARY WATCH Order Confirmation (#${order.orderId || ''})`,
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
      htmlContent: generatePaymentSuccessHtml(order, user, paymentDetails, settings),
      textContent: generatePaymentSuccessText(order, user, paymentDetails, settings)
    };

    const response = await client.transactionalEmails.sendTransacEmail(payload);

    console.log(
      `[Brevo Email] Payment success email sent for #${order.orderId} to ${recipientEmail} (Message ID: ${response?.messageId || 'dispatched'})`
    );

    // Atomically persist paymentSuccessEmailSent flag in MongoDB Atlas
    try {
      const Order = require('../models/Order');
      await Order.findByIdAndUpdate(order._id, {
        $set: {
          paymentSuccessEmailSent: true,
          paymentSuccessEmailSentAt: new Date()
        }
      });
      order.paymentSuccessEmailSent = true;
      order.paymentSuccessEmailSentAt = new Date();
    } catch (saveErr) {
      console.warn('[Brevo Email] Could not persist paymentSuccessEmailSent status:', saveErr.message);
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
      `[Brevo Email] Payment success email delivery failed for #${order.orderId} (${recipientEmail}) [Status: ${statusCode}]: ${errorMessage}`
    );

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Generates a luxury black-and-gold responsive HTML order delivered email for TICKING
 */
const generateOrderDeliveredHtml = (order, user = {}, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const shippingAddr = order.shippingAddress || {};
  const recipientName = (shippingAddr.fullName || user?.name || 'Valued Collector').trim();
  const firstName = recipientName.split(' ')[0] || 'Collector';
  const orderNumber = order.orderId || 'TCK-DELIVERED';
  const deliveryDate = formatOrderDate(order.deliveredAt || new Date());
  const currentYear = new Date().getFullYear();
  const paymentMethodLabel = order.paymentMethod || 'Online Payment';
  const paymentStatusText = order.paymentStatus === 'Paid' ? 'Paid (Verified)' : (order.paymentStatus || 'Paid');
  const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');

  const itemsHtml = (order.items || [])
    .map((item) => {
      const itemSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #1C1C24;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
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
                <td width="120" valign="top" style="text-align: right;">
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
  <title>Your Order Has Been Delivered #${orderNumber} | ${storeName}</title>
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
              
              <!-- Delivery Confirmation Badge -->
              <div style="display: inline-block; background-color: #064E3B; border: 1px solid #059669; border-radius: 50px; padding: 6px 14px; margin-bottom: 16px;">
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; color: #34D399; text-transform: uppercase;">
                  &#10003; PACKAGE DELIVERED &bull; WHITE-GLOVE DISPATCH
                </span>
              </div>

              <!-- Heading -->
              <h1 style="font-family: Georgia, serif; font-size: 24px; line-height: 1.35; font-weight: 700; color: #FFFFFF; margin: 0 0 14px 0;">
                Your Order Has Been Delivered, ${firstName}.
              </h1>

              <p style="font-size: 14px; line-height: 1.7; color: #C4C4CC; margin: 0 0 22px 0;">
                We are pleased to confirm that your exquisite timepiece acquisition for Order <strong style="color: #F3E5AB;">#${orderNumber}</strong> has been successfully hand-delivered to your designated address by our private white-glove courier service. We trust that this masterwork brings you immense joy.
              </p>

              <!-- Delivery Overview Ledger -->
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
                          <div style="font-size: 9px; color: #7E7E8B; text-transform: uppercase; letter-spacing: 0.15em;">Delivered On</div>
                          <div style="font-size: 12px; font-weight: 600; color: #FFFFFF; margin-top: 3px;">${deliveryDate}</div>
                        </td>
                        <td width="33%" style="text-align: right;">
                          <div style="font-size: 9px; color: #7E7E8B; text-transform: uppercase; letter-spacing: 0.15em;">Delivery Status</div>
                          <div style="font-size: 11px; font-weight: 700; color: #10B981; margin-top: 3px; text-transform: uppercase;">
                            Delivered
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Section: Delivered Timepieces -->
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; color: #D4AF37; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #1C1C24; padding-bottom: 6px;">
                Delivered Timepieces (${order.items?.length || 0})
              </div>

              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                ${itemsHtml}
              </table>

              <!-- Financial Summary Ledger -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #14141A; border: 1px solid #262633; border-radius: 12px; margin-bottom: 26px;">
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
                          Order Total
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
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 26px;">
                <tr>
                  <td class="col-half" width="48%" valign="top" style="background-color: #121217; border: 1px solid #262633; border-radius: 12px; padding: 18px 20px;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.18em; color: #D4AF37; text-transform: uppercase; margin-bottom: 10px;">
                      Delivered To
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
                      Billing & Settlement
                    </div>
                    <div style="font-size: 13px; color: #FFFFFF; margin-bottom: 6px;">
                      <span style="color: #7E7E8B;">Payment Method:</span> <strong>${paymentMethodLabel}</strong>
                    </div>
                    <div style="font-size: 13px; color: #FFFFFF; margin-bottom: 6px;">
                      <span style="color: #7E7E8B;">Payment Status:</span> <strong style="color: #10B981;">${paymentStatusText}</strong>
                    </div>
                    <div style="font-size: 11px; color: #8A8A96; word-break: break-all;">
                      <span style="color: #7E7E8B;">Order Ref:</span> #${orderNumber}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Call to Action: View in Vault -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 26px;">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/orders/${order._id || order.orderId}" target="_blank" style="display: inline-block; background: linear-gradient(90deg, #D4AF37 0%, #B8860B 100%); color: #000000; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; padding: 15px 34px; border-radius: 50px; box-shadow: 0 4px 18px rgba(212, 175, 55, 0.35);">
                      ACCESS YOUR HOROLOGICAL CERTIFICATE &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Post-Delivery Privileges / Warranty -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #1C1C24; padding-top: 22px; margin-top: 8px;">
                <tr>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 6px;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">5-Year Warranty</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">Activated Upon Delivery</div>
                  </td>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 6px; border-left: 1px solid #1F1F2A; border-right: 1px solid #1F1F2A;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">Complimentary Sizing</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">At Any Partner Boutique</div>
                  </td>
                  <td class="column-pill" width="33%" style="text-align: center; padding: 0 6px;">
                    <div style="font-size: 10px; font-weight: 700; color: #F3E5AB; letter-spacing: 0.12em; text-transform: uppercase;">Concierge Care</div>
                    <div style="font-size: 10px; color: #7E7E8B; margin-top: 4px;">24/7 Collector Support</div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #070709; padding: 24px 34px; border-top: 1px solid #1C1C24; text-align: center;">
              <p style="font-size: 11px; color: #7A7A84; line-height: 1.6; margin: 0 0 8px 0;">
                If you have questions regarding warranty registration or sizing, contact our private concierge at <span style="color: #D4AF37;">${conciergeEmail}</span> or call <span style="color: #D4AF37;">${boutiquePhone}</span>.
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
 * Generates clean plain text alternative for order delivered email
 */
const generateOrderDeliveredText = (order, user = {}, settings = {}) => {
  const { storeName, supportEmail: conciergeEmail, phone: boutiquePhone } = getSafeSettings(settings);
  const shippingAddr = order.shippingAddress || {};
  const recipientName = (shippingAddr.fullName || user?.name || 'Valued Collector').trim();
  const firstName = recipientName.split(' ')[0] || 'Collector';
  const orderNumber = order.orderId || 'TCK-DELIVERED';
  const deliveryDate = formatOrderDate(order.deliveredAt || new Date());
  const currentYear = new Date().getFullYear();
  const paymentMethodLabel = order.paymentMethod || 'Online Payment';
  const paymentStatusText = order.paymentStatus === 'Paid' ? 'Paid (Verified)' : (order.paymentStatus || 'Paid');

  const itemsText = (order.items || [])
    .map((item, idx) => `  ${idx + 1}. ${item.name} (${item.brand || 'Luxury Watch'})\n     Qty: ${item.quantity} | Unit Price: ${formatCurrency(item.price)} | Total: ${formatCurrency(item.price * item.quantity)}`)
    .join('\n\n');

  return `
================================================================================
                    T I C K I N G   L U X U R Y   W A T C H
                     Haute Horlogerie - Swiss Craftsmanship
================================================================================

ORDER DELIVERED CONFIRMATION
Order Reference: #${orderNumber}
Delivery Status: DELIVERED
Delivered On: ${deliveryDate}

Dear ${firstName},

We are pleased to confirm that your timepiece acquisition for Order #${orderNumber} has been successfully hand-delivered by our white-glove courier service.

DELIVERED TIMEPIECES:
--------------------------------------------------------------------------------
${itemsText}
--------------------------------------------------------------------------------

ORDER SUMMARY:
- Total Amount: ${formatCurrency(order.grandTotal)}
- Payment Method: ${paymentMethodLabel}
- Payment Status: ${paymentStatusText}

DELIVERED TO:
${shippingAddr.fullName || recipientName}
${shippingAddr.address || ''}
${shippingAddr.city || ''}, ${shippingAddr.state || ''} - ${shippingAddr.pincode || ''}
Phone: ${shippingAddr.phone || 'N/A'}

Your 5-Year Comprehensive Manufacture Warranty is active effective immediately.
For concierge support or inquiries, please contact ${conciergeEmail} or call ${boutiquePhone}.

(c) ${currentYear} ${storeName}. All rights reserved.
`;
};

/**
 * Sends an Order Delivered confirmation email via Brevo
 */
const sendOrderDeliveredEmail = async ({ order, user }) => {
  if (!order) {
    return { success: false, reason: 'No order provided' };
  }

  // 1. Idempotency check: Do not send duplicate delivery emails
  if (order.deliveryEmailSent) {
    console.log(`[Brevo Email] Delivery email already sent for #${order.orderId || order._id}. Skipping.`);
    return {
      success: true,
      skipped: true,
      reason: 'Order delivery email already dispatched previously'
    };
  }

  // 2. Status check: Order must be Delivered
  if (order.orderStatus !== 'Delivered') {
    console.log(`[Brevo Email] Order #${order.orderId} status is not Delivered (${order.orderStatus}). Delivery email skipped.`);
    return {
      success: false,
      skipped: true,
      reason: 'Order status is not Delivered'
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
    console.warn(`[Brevo Email] No valid recipient email address for order #${order.orderId || order._id}. Delivery email skipped.`);
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

  if (!apiKey || !senderEmail) {
    console.warn(
      `[Brevo Email] Configuration notice: BREVO_API_KEY or BREVO_SENDER_EMAIL is not set in backend/.env. Order #${order.orderId} delivery email skipped.`
    );
    return {
      success: false,
      skipped: true,
      reason: 'Brevo credentials not configured in backend/.env'
    };
  }

  try {
    const client = new BrevoClient({ apiKey });

    const payload = {
      subject: `Your Order Has Been Delivered – TICKING LUXARY WATCH (#${order.orderId || ''})`,
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
      htmlContent: generateOrderDeliveredHtml(order, user, settings),
      textContent: generateOrderDeliveredText(order, user, settings)
    };

    const response = await client.transactionalEmails.sendTransacEmail(payload);

    console.log(
      `[Brevo Email] Order delivered email sent for #${order.orderId} to ${recipientEmail} (Message ID: ${response?.messageId || 'dispatched'})`
    );

    // Atomically persist deliveryEmailSent flag in MongoDB Atlas
    try {
      const Order = require('../models/Order');
      await Order.findByIdAndUpdate(order._id, {
        $set: {
          deliveryEmailSent: true,
          deliveryEmailSentAt: new Date()
        }
      });
      order.deliveryEmailSent = true;
      order.deliveryEmailSentAt = new Date();
    } catch (saveErr) {
      console.warn('[Brevo Email] Could not persist deliveryEmailSent status:', saveErr.message);
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
      `[Brevo Email] Delivery email failed for #${order.orderId} (${recipientEmail}) [Status: ${statusCode}]: ${errorMessage}`
    );

    return {
      success: false,
      error: errorMessage
    };
  }
};

module.exports = {
  sendRegistrationWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentSuccessEmail,
  sendOrderDeliveredEmail,
  sendAccountDeletedEmail,
  sendPasswordResetOtpEmail,
  sendPasswordResetSuccessEmail,
  generateWelcomeHtml,
  generateWelcomeText,
  generateOrderConfirmationHtml,
  generateOrderConfirmationText,
  generatePaymentSuccessHtml,
  generatePaymentSuccessText,
  generateOrderDeliveredHtml,
  generateOrderDeliveredText,
  generateAccountDeletedHtml,
  generateAccountDeletedText,
  generatePasswordResetOtpHtml,
  generatePasswordResetOtpText
};
