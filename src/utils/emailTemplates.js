const CURRENT_YEAR = new Date().getFullYear();
const SUPPORT_EMAIL =
  process.env.MAIL_SUPPORT_EMAIL ||
  process.env.MAIL_USERNAME ||
  "support@exegesisproject.org";
const UNSUBSCRIBE_URL =
  process.env.UNSUBSCRIBE_URL || `mailto:${SUPPORT_EMAIL}?subject=unsubscribe`;

// Public base URL of this API — used to build absolute links (logo, buttons)
// inside emails. Email clients can't resolve relative paths.
// NOTE: must be the BACKEND (which serves /assets/logo.png) — never CLIENT_URL
// (the frontend can't serve the logo, so images would break and show alt text).
const APP_BASE_URL = (
  process.env.APP_BASE_URL ||
  process.env.BACKEND_URL ||
  "https://exegesisbackend-production.up.railway.app"
).replace(/\/+$/, "");

// Brand logo embedded in every template's header. Served by the backend at
// /assets/logo.png; override with LOGO_URL if hosted elsewhere.
// The mailer (emailService.js) swaps this URL for an embedded CID attachment
// at send time so the logo renders even when remote images are blocked.
const LOGO_URL = process.env.LOGO_URL || `${APP_BASE_URL}/assets/logo.png`;

// Exact URL string used inside template HTML — matched by emailService to
// attach the logo file instead of linking it remotely.
export const EMAIL_LOGO_URL = LOGO_URL;

// Content-ID used for the embedded logo attachment
export const EMAIL_LOGO_CID = "exegesis-logo";

// Common header with the Exegesis Project logo, shared across all templates.
// Uses a table-based layout for maximum email-client compatibility.
const emailHeader = (subtitle) => `
<!-- Header -->
<tr>
  <td style="background-color: #1e3a5f; background-image: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 28px 40px 26px; text-align: center;">
    <img src="${LOGO_URL}" alt="Exegesis Project" width="140" style="display: block; margin: 0 auto 12px; width: 140px; height: auto; padding: 10px; background-color: #ffffff; border-radius: 14px;" />
    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 3px;">
      EXEGESIS PROJECT
    </h1>
    <p style="margin: 6px 0 0; font-size: 13px; color: #d7e3f0; letter-spacing: 1px;">
      ${subtitle}
    </p>
  </td>
</tr>`;

// Frontend app URL used for sign-in links inside emails
const FRONTEND_APP_URL = (
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "https://app.exegesisproject.org"
).replace(/\/+$/, "");

// Physical address required by CAN-SPAM Act
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "Exegesis Bible App";

// Common footer shared across all templates
const emailFooter = `
<!-- Footer -->
<tr>
  <td style="background-color: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #eee;">
    <p style="margin: 0 0 8px; font-size: 14px; color: #888888;">
      Need help? Reply to this email or contact us at
    </p>
    <p style="margin: 0 0 12px; font-size: 14px; color: #1e3a5f;">
      <a href="mailto:${SUPPORT_EMAIL}" style="color: #1e3a5f; text-decoration: none;">${SUPPORT_EMAIL}</a>
    </p>
    <p style="margin: 0 0 8px; font-size: 12px; color: #aaaaaa;">
      <a href="${UNSUBSCRIBE_URL}" style="color: #aaaaaa; text-decoration: underline;">Unsubscribe</a>
      &nbsp;|&nbsp;
      <a href="mailto:${SUPPORT_EMAIL}?subject=Support" style="color: #aaaaaa; text-decoration: underline;">Contact Support</a>
    </p>
    <p style="margin: 12px 0 0; font-size: 11px; color: #bbbbbb;">
      ${COMPANY_ADDRESS}
    </p>
    <p style="margin: 8px 0 0; font-size: 12px; color: #aaaaaa;">
      &copy; ${CURRENT_YEAR} Exegesis Bible App. All rights reserved.
    </p>
  </td>
</tr>`;

export const emailTemplates = {
  verification: (code, firstName) => ({
    subject: "Exegesis Project - Verify Your Email",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          ${emailHeader("Bible App")}
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e3a5f; text-align: center;">
                Verify Your Email Address
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                Hello <strong style="color: #1e3a5f;">${firstName || "there"}</strong>,
              </p>
              
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                Thank you for creating your Exegesis account. Please use the verification code below to confirm your email address:
              </p>
              
              <!-- Verification Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 28px 24px; background-color: #f8f9fa; background-image: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; text-align: center; border: 2px dashed #ced4da;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">
                      Your Verification Code
                    </p>
                    <p style="margin: 0; font-size: 36px; font-weight: 700; color: #1e3a5f; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${code}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; font-size: 14px; color: #888888; text-align: center;">
                This code will expire in <strong>24 hours</strong>. If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
          
        
          
          ${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),

  welcome: (firstName) => ({
    subject: "Welcome to Exegesis - Your Spiritual Journey Begins",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Exegesis</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          ${emailHeader("Search The Scriptures Daily")}
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e3a5f; text-align: center;">
                Welcome, ${firstName}!
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                Your account has been successfully created. We're thrilled to have you join our community of believers growing in Scripture daily.
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; background-image: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 16px; font-size: 18px; color: #1e3a5f; text-align: center;">
                      What's Next?
                    </h3>
                    <p style="margin: 0; padding-left: 20px; color: #555555; line-height: 2; font-size: 16px;">
                      Complete your daily Bible reading plans<br/>
                      Track your spiritual journey<br/>
                      Explore verse explanations<br/>
                      Connect with other believers
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                <strong>Important:</strong> Please verify your email address using the code sent in a separate email to complete your account setup.
              </p>
            </td>
          </tr>
          
          <!-- Scripture Quote -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fdf6e3; background-image: linear-gradient(135deg, #fef9f0 0%, #fdf6e3 100%); border-radius: 12px; padding: 20px; border-left: 4px solid #d4a84b;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; font-size: 16px; font-style: italic; color: #555555; line-height: 1.6;">
                      "Trust in the Lord with all your heart and lean not on your own understanding."
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #888888; text-align: right;">
                      &mdash; Proverbs 3:5
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          ${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),

  passwordReset: (code, firstName) => ({
    subject: "Exegesis Project - Password Reset Request",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          ${emailHeader("Bible App")}
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e3a5f; text-align: center;">
                Reset Your Password
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                Hello <strong style="color: #1e3a5f;">${firstName || "there"}</strong>,
              </p>
              
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                We received a request to reset your password. Use the code below to proceed:
              </p>
              
              <!-- Verification Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 28px 24px; background-color: #f8f9fa; background-image: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; text-align: center; border: 2px dashed #ced4da;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">
                      Your Reset Code
                    </p>
                    <p style="margin: 0; font-size: 36px; font-weight: 700; color: #1e3a5f; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${code}
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fdf6e3; border-radius: 10px; padding: 16px; margin-top: 24px; border-left: 4px solid #d4a84b;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #6b5d3f; line-height: 1.6;">
                      <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account is still secure.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; font-size: 14px; color: #888888; text-align: center;">
                This code will expire in <strong>24 hours</strong>.
              </p>
            </td>
          </tr>
          
          ${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),

  accountCreated: ({ firstName, username, password, role }) => ({
    subject: "Exegesis Project - Your Account Has Been Created",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Account Has Been Created</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          ${emailHeader("Search The Scriptures Daily")}
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e3a5f; text-align: center;">
                Welcome, ${firstName || "there"}!
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555; text-align: center;">
                An account has been created for you on <strong style="color: #1e3a5f;">Exegesis</strong>. Use the credentials below to sign in for the first time.
              </p>
              
              <!-- Role Badge -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; padding: 6px 18px; background-color: #e8f0fe; border: 1px solid #2d5a87; border-radius: 999px; font-size: 13px; font-weight: 600; color: #1e3a5f; letter-spacing: 1px; text-transform: uppercase;">
                      ${role || "Member"} Access
                    </span>
                  </td>
                </tr>
              </table>
              
              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 26px 24px; background-color: #f8f9fa; background-image: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; border: 2px dashed #ced4da;">
                    <p style="margin: 0 0 16px; font-size: 14px; color: #888888; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                      Your Login Credentials
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #888888; width: 45%;">Username:</td>
                        <td style="padding: 8px 0; font-size: 15px; font-weight: 700; color: #1e3a5f; font-family: 'Courier New', monospace;">${username}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #888888; width: 45%;">Temporary Password:</td>
                        <td style="padding: 8px 0; font-size: 15px; font-weight: 700; color: #1e3a5f; font-family: 'Courier New', monospace; letter-spacing: 1px;">${password}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #888888; width: 45%;">Role:</td>
                        <td style="padding: 8px 0; font-size: 15px; font-weight: 700; color: #1e3a5f;">${role || "Member"}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Sign In Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 8px;">
                <tr>
                  <td align="center">
                    <a href="${FRONTEND_APP_URL}/login" style="display: inline-block; padding: 14px 44px; background-color: #1e3a5f; background-image: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px; letter-spacing: 0.5px;">
                      Sign In to Your Account
                    </a>
                  </td>
                </tr>
              </table>
              
             
          
          ${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),
};

export default emailTemplates;
