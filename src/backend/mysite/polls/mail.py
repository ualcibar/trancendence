import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import random
import string
import hashlib
from cryptography.fernet import Fernet
import os

ip = os.environ.get('IP')


def generate_random_verification_code(length):
    characters = string.ascii_uppercase + string.digits
    random_string = ''.join(random.choice(characters) for _ in range(length))
    return random_string

def encript(text, f):
    encripted_text = f.encrypt(text.encode())
    return encripted_text

def desencript(encripted_text, f):
    desencripted_text = f.decrypt(encripted_text).decode('utf-8')
    return desencripted_text

def generateFernetObj():
    key = Fernet.generate_key()
    f = Fernet(key)
    return f

def generate_verification_url(encripted_token, encripted_mail):
    verification_url = "https://" + ip + ":1501/verify?token=" + encripted_token.decode('utf-8') + "&user=" + encripted_mail.decode('utf-8')
    return verification_url

def generate_token():
    token = hashlib.sha256(str(random.getrandbits(256)).encode('utf-8')).hexdigest()
    return token

def send_TwoFA_mail(random_verification_code, receiver_email):
    sender_email = "trascendence1804@gmail.com"
    password = "xqot adkb wqor dcst"#Trascendence24-

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["subject"] = "SPACEPONG TWO FACTOR AUTHENTIFICATION CODE: " + random_verification_code
    body = '''<html lang="en"> 
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPACEPONG</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f2f2f2;
        }
        .message-box {
            width: 400px;
            padding: 20px;
            border: 2px solid #ccc;
            border-radius: 10px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .message-code{
            font-size: 35px;
        }
    </style>
    </head>
    <body>
    <div class="message-box">
        <h2>2FA VERIFICATION CODE IS:</h2>
        <p class="message-code">''' + random_verification_code + '''</p>
    </div>
    </body>
    </html>'''

    message.attach(MIMEText(body, "html"))
    mail = smtplib.SMTP("smtp.gmail.com", 587)
    mail.ehlo()
    mail.starttls()
    mail.login(sender_email, password)
    text = message.as_string()
    mail.sendmail(sender_email, receiver_email, text)
    mail.quit()

def send_TwoFA_Activation_mail(random_verification_code, receiver_email):
    sender_email = "trascendence1804@gmail.com"
    password = "xqot adkb wqor dcst"#Trascendence24-

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["subject"] = "SPACEPONG TWO FACTOR AUTHENTIFICATION ACTIVATION CODE: " + random_verification_code
    body = '''<html lang="en"> 
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPACEPONG</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f2f2f2;
        }
        .message-box {
            width: 400px;
            padding: 20px;
            border: 2px solid #ccc;
            border-radius: 10px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .message-code{
            font-size: 35px;
        }
    </style>
    </head>
    <body>
    <div class="message-box">
        <h2>2FA VERIFICATION CODE IS:</h2>
        <p class="message-code">''' + random_verification_code + '''</p>
    </div>
    </body>
    </html>'''

    message.attach(MIMEText(body, "html"))
    mail = smtplib.SMTP("smtp.gmail.com", 587)
    mail.ehlo()
    mail.starttls()
    mail.login(sender_email, password)
    text = message.as_string()
    mail.sendmail(sender_email, receiver_email, text)
    mail.quit()

def send_TwoFA_Deactivation_mail(receiver_email):
    sender_email = "trascendence1804@gmail.com"
    password = "xqot adkb wqor dcst"#Trascendence24-

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["subject"] = "SPACEPONG TWO FACTOR AUTHENTIFICATION DEACTIVATION"
    body = '''<html lang="en"> 
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPACEPONG</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f2f2f2;
        }
        .message-box {
            width: 400px;
            padding: 20px;
            border: 2px solid #ccc;
            border-radius: 10px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .message-code{
            font-size: 35px;
        }
    </style>
    </head>
    <body>
    <div class="message-box">
        <h2>SPACEPONG TWO FACTOR AUTHENTIFICATION HAS BEEN DEACTIVATED</h2>
    </div>
    </body>
    </html>'''

    message.attach(MIMEText(body, "html"))
    mail = smtplib.SMTP("smtp.gmail.com", 587)
    mail.ehlo()
    mail.starttls()
    mail.login(sender_email, password)
    text = message.as_string()
    mail.sendmail(sender_email, receiver_email, text)
    mail.quit()

def send_Verification_mail(verification_url, receiver_email):
    sender_email = "trascendence1804@gmail.com"
    password = "xqot adkb wqor dcst"#Trascendence24-
    
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["subject"] = "MAIL AUTHENTIFICATION FOR SPACEPONG: "
    body = '''<html lang="en"> 
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPACEPONG</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f2f2f2;
        }
        .message-box {
            width: 400px;
            padding: 20px;
            border: 2px solid #ccc;
            border-radius: 10px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
    </style>
    </head>
    <body>
    <div class="message-box">
     <h2>EMAIL VERIFICATION</h2>
     <a href=''' + verification_url + ''' target="_blank"><button>VERIFY</button></a>
    </div>
    </body>
    </html>'''

    message.attach(MIMEText(body, "html"))
    mail = smtplib.SMTP("smtp.gmail.com", 587)
    mail.ehlo()
    mail.starttls()
    mail.login(sender_email, password)
    text = message.as_string()
    mail.sendmail(sender_email, receiver_email, text)
    mail.quit()

def send_password_mail(receiver_email):
    sender_email = "trascendence1804@gmail.com"
    password = "xqot adkb wqor dcst"#Trascendence24-
    
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["subject"] = "SPACEPONG PASSWORD HAS BEEN UPDATED"
    body = '''<html lang="en"> 
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPACEPONG</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f2f2f2;
        }
        .message-box {
            width: 400px;
            padding: 20px;
            border: 2px solid #ccc;
            border-radius: 10px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
    </style>
    </head>
    <body>
    <div class="message-box">
        <h2>SPACEPONG PASSWORD HAS BEEN UPDATED</h2>
    </div>
    </body>
    </html>'''

    message.attach(MIMEText(body, "html"))
    mail = smtplib.SMTP("smtp.gmail.com", 587)
    mail.ehlo()
    mail.starttls()
    mail.login(sender_email, password)
    text = message.as_string()
    mail.sendmail(sender_email, receiver_email, text)
    mail.quit()

def send_NoLongerSpacepong_mail(receiver_email):
    sender_email = "trascendence1804@gmail.com"
    password = "xqot adkb wqor dcst"#Trascendence24-
    
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["subject"] = "SPACEPONG ACCOUNT IS NO LONGER LINKED TO YOUR EMAIL"
    body = '''<html lang="en"> 
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPACEPONG</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f2f2f2;
        }
        .message-box {
            width: 400px;
            padding: 20px;
            border: 2px solid #ccc;
            border-radius: 10px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
    </style>
    </head>
    <body>
    <div class="message-box">
        <h2>THIS EMAIL IS NO LONGER LINKED TO SPACEPONG</h2>
    </div>
    </body>
    </html>'''

    message.attach(MIMEText(body, "html"))
    mail = smtplib.SMTP("smtp.gmail.com", 587)
    mail.ehlo()
    mail.starttls()
    mail.login(sender_email, password)
    text = message.as_string()
    mail.sendmail(sender_email, receiver_email, text)
    mail.quit()