/**
 * Email service for sending liquidation alerts
 */

import nodemailer from "nodemailer";

export interface EmailAlert {
  to: string;
  subject: string;
  html: string;
}

// Configure email transporter
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else if (process.env.SMTP_HOST) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Fallback to console logging in development
    console.warn("[Email Service] No email configuration found, will log to console");
    return null;
  }
};

const transporter = createTransporter();

/**
 * Send an email alert
 */
export async function sendEmail(alert: EmailAlert): Promise<boolean> {
  if (!transporter) {
    console.log("[Email Service] Would send email:", alert);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: alert.to,
      subject: alert.subject,
      html: alert.html,
    });
    console.log(`[Email Service] Sent email to ${alert.to}: ${alert.subject}`);
    return true;
  } catch (error: any) {
    console.error("[Email Service] Failed to send email:", error.message);
    return false;
  }
}

/**
 * Send liquidation warning email
 */
export async function sendLiquidationWarning(
  email: string,
  positions: Array<{
    coin: string;
    size: string;
    currentPrice: string;
    liquidationPrice: string;
    distancePercent: number;
  }>
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
    .position { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border: 1px solid #e5e7eb; }
    .critical { border-left: 4px solid #dc2626; }
    .button { background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; }
    .label { color: #6b7280; font-size: 14px; }
    .value { font-weight: bold; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ LIQUIDATION WARNING</h1>
      <p style="margin: 10px 0 0 0;">Immediate Action Required</p>
    </div>
    <div class="content">
      <div class="warning">
        <h2 style="margin-top: 0; color: #dc2626;">🚨 Critical Risk Alert</h2>
        <p>One or more of your positions on Hyperliquid is approaching liquidation. Take immediate action to avoid losing your position.</p>
      </div>

      <h3>At-Risk Positions:</h3>
      ${positions.map(pos => `
        <div class="position ${pos.distancePercent < 10 ? 'critical' : ''}">
          <table>
            <tr>
              <td class="label">Asset:</td>
              <td class="value">${pos.coin}</td>
              <td class="label">Size:</td>
              <td class="value">${pos.size}</td>
            </tr>
            <tr>
              <td class="label">Current Price:</td>
              <td class="value">$${pos.currentPrice}</td>
              <td class="label">Liquidation Price:</td>
              <td class="value" style="color: #ef4444;">$${pos.liquidationPrice}</td>
            </tr>
            <tr>
              <td colspan="4">
                <div style="margin-top: 10px;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Distance to Liquidation</div>
                  <div style="background: #fee2e2; border-radius: 4px; overflow: hidden; height: 8px;">
                    <div style="background: ${pos.distancePercent < 10 ? '#dc2626' : pos.distancePercent < 20 ? '#f59e0b' : '#22c55e'}; height: 100%; width: ${pos.distancePercent}%;"></div>
                  </div>
                  <div style="font-weight: bold; color: ${pos.distancePercent < 10 ? '#dc2626' : '#f59e0b'}; margin-top: 5px;">${pos.distancePercent.toFixed(2)}%</div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `).join('')}

      <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 6px;">
        <h3 style="margin-top: 0; color: #1e40af;">Recommended Actions:</h3>
        <ul>
          <li><strong>Add Margin:</strong> Deposit more funds to increase your margin buffer</li>
          <li><strong>Reduce Position Size:</strong> Close part of your position to lower risk</li>
          <li><strong>Close Position:</strong> Exit the position entirely to avoid liquidation</li>
          <li><strong>Lower Leverage:</strong> Reduce leverage to increase liquidation distance</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/trade" class="button">
          Go to Trading Platform →
        </a>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px; font-size: 13px;">
        <strong>⏰ Time Sensitive:</strong> Liquidation can happen quickly during volatile markets. Act immediately to protect your position.
      </div>
    </div>

    <div style="margin-top: 20px; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
      <p>This is an automated alert from HyperTrade. You're receiving this because you have liquidation alerts enabled.</p>
      <p>To disable alerts, visit your account settings.</p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: email,
    subject: "🚨 URGENT: Liquidation Warning - Immediate Action Required",
    html,
  });
}

/**
 * Send position liquidated notification
 */
export async function sendLiquidationNotification(
  email: string,
  position: {
    coin: string;
    size: string;
    liquidationPrice: string;
    loss: string;
  }
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .alert { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 6px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">💥 Position Liquidated</h1>
    </div>
    <div class="content">
      <div class="alert">
        <h2 style="margin: 0; color: #dc2626;">Your ${position.coin} position has been liquidated</h2>
        <p style="margin: 15px 0;">
          <strong>Size:</strong> ${position.size} ${position.coin}<br>
          <strong>Liquidation Price:</strong> $${position.liquidationPrice}<br>
          <strong>Estimated Loss:</strong> <span style="color: #dc2626;">-$${position.loss}</span>
        </p>
      </div>

      <p>Your position was automatically closed by the exchange due to insufficient margin. Review your risk management strategy to prevent future liquidations.</p>

      <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 6px;">
        <h3 style="margin-top: 0;">Tips to Avoid Liquidations:</h3>
        <ul>
          <li>Use lower leverage</li>
          <li>Set stop-loss orders</li>
          <li>Monitor positions regularly</li>
          <li>Maintain adequate margin buffer</li>
        </ul>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: email,
    subject: "💥 Position Liquidated - " + position.coin,
    html,
  });
}
