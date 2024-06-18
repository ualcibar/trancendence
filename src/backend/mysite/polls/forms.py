from django import forms


class UsernameForm(forms.Form):
    currentUsername = forms.CharField(label='Current Username', max_length=150)

class CheckPasswordForm(forms.Form):
    currentPass = forms.CharField(label='currentPass', widget=forms.PasswordInput)

class FriendIdForm(forms.Form):
    friend_id = forms.IntegerField(label='friend_id')