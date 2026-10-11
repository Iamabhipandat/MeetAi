import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings


def _send_email_sync(to_email: str, subject: str, html_body: str):
    """Send email using Gmail SMTP (synchronous, run in thread)."""
    # If no Gmail configured, print to console (dev mode)
    if not settings.GMAIL_USER or not settings.GMAIL_APP_PASSWORD:
        print(f"\n{'='*60}")
        print(f"[DEV EMAIL] To: {to_email}")
        print(f"[DEV EMAIL] Subject: {subject}")
        print(f"[DEV EMAIL] Body preview: {html_body[:300]}")
        print(f"{'='*60}\n")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"MeetAI <{settings.GMAIL_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
        server.sendmail(settings.GMAIL_USER, to_email, msg.as_string())


def send_verification_email(to_email: str, name: str, token: str):
    """Send the email verification link."""
    verify_url = f"{settings.FRONTEND_URL}/verify?token={token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Inter, Arial, sans-serif; background: #f9fafb; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px;
                  border: 1px solid #e5e7eb; padding: 40px;">
        <div style="margin-bottom: 28px;">
          <span style="background: #4f46e5; color: white; padding: 6px 14px;
                       border-radius: 8px; font-weight: 700; font-size: 16px;">MeetAI</span>
        </div>
        <h1 style="font-size: 22px; color: #111827; margin-bottom: 8px;">
          Verify your email, {name.split()[0]}
        </h1>
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 28px;">
          Thanks for signing up! Click the button below to verify your email address
          and start hosting AI-powered meetings.
        </p>
        <a href="{verify_url}"
           style="display: inline-block; background: #4f46e5; color: white;
                  padding: 12px 28px; border-radius: 8px; text-decoration: none;
                  font-weight: 600; font-size: 15px;">
          Verify Email Address
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 28px;">
          Or copy this link: <a href="{verify_url}" style="color: #4f46e5;">{verify_url}</a>
        </p>
        <p style="color: #d1d5db; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
          This link expires in 24 hours. If you didn't create this account, ignore this email.
        </p>
      </div>
    </body>
    </html>
    """
    _send_email_sync(to_email, "Verify your MeetAI account", html)


def send_welcome_email(to_email: str, name: str):
    """Send a welcome email after verification."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Inter, Arial, sans-serif; background: #f9fafb; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px;
                  border: 1px solid #e5e7eb; padding: 40px;">
        <h1 style="font-size: 22px; color: #111827;">You're in, {name.split()[0]}! 🎉</h1>
        <p style="color: #6b7280; line-height: 1.6;">
          Your MeetAI account is verified. Start creating meetings and let AI handle
          the Q&A for you.
        </p>
        <a href="{settings.FRONTEND_URL}"
           style="display: inline-block; background: #4f46e5; color: white;
                  padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Go to Dashboard
        </a>
      </div>
    </body>
    </html>
    """
    _send_email_sync(to_email, "Welcome to MeetAI!", html)
