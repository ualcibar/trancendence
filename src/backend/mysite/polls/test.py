import mail

fernet = mail.generateFernetObj()
string = 'hola que tal'
encripted_text = mail.encript(string, fernet)
desencripted_text = mail.desencript(encripted_text, fernet).decode('utf-8')
print(f'antes de encriptar-----> ', string)
print(f'después de encriptar-----> ', encripted_text)
print(f'después de desencriptar-----> ', desencripted_text)