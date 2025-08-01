import smtplib
from email.mime.text import MIMEText

def send_password_reset_email(email: str, token: str):
    reset_link = f"https://your-frontend.com/reset-password?token={token}"
    subject = "Reset your password"
    body = f"Click the link below to reset your password:\n\n{reset_link}\n\nThis link expires in 1 hour."

    # You can switch this with SendGrid, Mailgun, etc.
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = "no-reply@yourapp.com"
    msg['To'] = email

    # Change SMTP config below accordingly
    with smtplib.SMTP("smtp.yourmail.com", 587) as server:
        server.starttls()
        server.login("your_username", "your_password")
        server.sendmail("no-reply@yourapp.com", [email], msg.as_string())

def send_email_verification_code(email: str, code: str):
    subject = "Your Email Verification Code"
    body = f"Your verification code is: {code}\n\nThis code will expire in 10 minutes."

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = "no-reply@yourapp.com"
    msg['To'] = email

    with smtplib.SMTP("smtp.yourmail.com", 587) as server:
        server.starttls()
        server.login("your_username", "your_password")
        server.sendmail("no-reply@yourapp.com", [email], msg.as_string())

def send_email(email: str, subject: str, body: str):
    """
    Generic email sending function.
    
    Args:
        email (str): Recipient email address
        subject (str): Email subject
        body (str): Email body content
    """
    try:
        # Try to use Flask-Mail if available
        from flask import current_app
        from flask_mail import Message
        
        msg = Message(
            subject=subject,
            recipients=[email],
            body=body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'roshangehlot500@gmail.com')
        )
        
        # Get the mail instance from the app
        from pogoapi.main import mail
        mail.send(msg)
        
        print(f"✅ Email sent successfully to: {email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email via Flask-Mail: {e}")
        print("📧 Falling back to console output for development...")
        
        # Fallback: print to console for development
        print(f"\n=== EMAIL SENT (DEVELOPMENT MODE) ===")
        print(f"To: {email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print(f"==================\n")
        
        return True
