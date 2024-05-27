import mail

fernet_obj = mail.generateFernetObj()
token_url = mail.generate_token()
mail.send_Verification_mail(mail.generate_verification_url(mail.encript(token_url, fernet_obj), mail.encript("jogainza.and@gmail.com", fernet_obj)), "jogainza.and@gmail.com")
token_TwoFA = mail.generate_random_verification_code(6)
mail.send_TwoFA_mail(token_TwoFA, "jogainza.and@gmail.com")
