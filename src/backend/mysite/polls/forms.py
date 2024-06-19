from django import forms
from django.core.exceptions import ValidationError
import re
import logging
logger = logging.getLogger('std')

g_color_choices = ['defulat', 'rojo','ambar', 'lima', 'pino', 'purpura']
g_language_choices = ['eu', 'en','es']
g_username_form = forms.CharField(max_length=20, min_length=6)
g_password_form = forms.CharField(max_length=20, min_length=6)
g_email_form = forms.EmailField()
g_color_form = forms.CharField(max_length=10)
g_language_form = forms.CharField(max_length=8)
g_anonymise_form = forms.BooleanField()
g_email_token_form = forms.CharField(max_length=6)
g_email_verification_token_form = forms.CharField(max_length=64)

g_username_form_opt = forms.CharField(max_length=20, min_length=6, required=False)
g_password_form_opt = forms.CharField(max_length=20, min_length=6, required=False)
g_email_form_opt = forms.EmailField(required=False)
g_color_form_opt = forms.CharField(max_length=10, required=False)
g_language_form_opt = forms.CharField(max_length=8, required=False)
g_anonymise_form_opt = forms.BooleanField(required=False)


def clean_using_form(value_str : str, form, self_ref):
    value_data = {value_str: self_ref.cleaned_data.get(value_str)}
    value_form = form(value_data)
    if not value_form.is_valid():
        raise ValidationError(value_form.errors[value_str])
    return value_data[value_str]

class UsernameForm(forms.Form):
    username = g_username_form
    def clean_username(self):
        username = self.cleaned_data.get('username')
        if len(username) > 20:
            raise ValidationError("Ensure this value has at most 20 characters.")
        return username

class PasswordForm(forms.Form):
    password = g_password_form
    def clean_password(self):
        password = self.cleaned_data.get('password')
        if len(password) < 6 or len(password) > 20:
            raise ValidationError("Ensure this value has at least 6 and at most 20 characters.")
        return password

class EmailForm(forms.Form):
    email = g_email_form
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not re.match(r'^[a-zA-Z0-9_.+-]+@gmail\.com$', email):
            raise ValidationError("Invalid Gmail address.")
        return email

class ColorForm(forms.Form):
    color = g_color_form
    def clean_color(self):
        color = self.cleaned_data.get('color')
        if color not in g_color_choices:
            raise ValidationError("Color not available")
        return color


class LanguageForm(forms.Form):
    language = g_language_form
    def clean_language(self):
        language = self.cleaned_data.get('language')
        if language not in g_language_choices:
            raise ValidationError("Language not available")
        return language

class EmailTokenForm(forms.Form):
    token = g_email_token_form
    def clean_language(self):
        token_data = self.cleaned_data.get('email_token')
        if len(token_data) > 6:
            raise ValidationError("Email token is longer than 6 char")
        return token_data

class EmailVerificationTokenForm(forms.Form):
    verify_token = g_email_verification_token_form
    def clean_language(self):
        verify_token_data = self.cleaned_data.get('email_verification_token')
        if len(verify_token_data) > 64:
            raise ValidationError("Email verify token is longer than 64 char")
        return verify_token_data


class VerifyEmailViewForm(forms.Form):
    encripted_token = forms.CharField()
    encripted_username = forms.CharField()

class SendMailNewMailViewForm(forms.Form):
    username = g_username_form
    new_mail = g_email_form
    old_mail = g_email_form

    def clean_username(self):
        return clean_using_form('username', UsernameForm, self)

    def new_mail(self):
        return clean_using_form('new_email', EmailForm, self)

    def old_mail(self):
        return clean_using_form('old_email', EmailForm, self)

class UserRegisterForm(forms.Form):
    username = g_username_form
    password = g_password_form
    email = g_email_form

    def clean_username(self):
        return clean_using_form('username', UsernameForm, self)

    def clean_password(self):
        return clean_using_form('password', PasswordForm, self)

    def clean_email(self):
        return clean_using_form('email', EmailForm, self)

class UserLoginForm(forms.Form):
    username = g_username_form
    password = g_password_form

    def clean_username(self):
        return clean_using_form('username', UsernameForm, self)

    def clean_password(self):
        return clean_using_form('password', PasswordForm, self)


class UserConfigForm(forms.Form):
    color = g_color_form_opt
    language = g_language_form_opt
    username = g_username_form_opt
    password = g_password_form_opt
    email = g_email_form_opt 
    anonymise = g_anonymise_form_opt

    def my_clean(self, value_str : str, form):
        value = self.cleaned_data.get(value_str)
        if value: 
            value_data = {value_str: value}
            value_form = form(value_data)
            if not value_form.is_valid():
                raise ValidationError(value_form.errors[value_str])
            return value_data[value_str]
        return value

    def clean_color(self):
        return self.my_clean(value_str='color', form=ColorForm)

    def clean_language(self):
        return self.my_clean(value_str='language', form=LanguageForm)
    
    def clean_username(self):
        return self.my_clean(value_str='username', form=UsernameForm)
    
    def clean_password(self):
        return self.my_clean(value_str='password', form=PasswordForm)
    
    def clean_email(self):
        return self.my_clean(value_str='email', form=EmailForm)
    
