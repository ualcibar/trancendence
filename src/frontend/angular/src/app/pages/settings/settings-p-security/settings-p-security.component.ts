import { Component, Input} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, PrivateUserInfo } from '../../../services/auth.service';

import { NgClass, CommonModule } from '@angular/common';
import { SettingsService } from '../../../services/settings.service';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient} from '@angular/common/http';
import {easeOut} from "../../../../assets/animations/easeOut";

@Component({
  selector: 'app-settings-p-security',
  standalone: true,
  imports: [FormsModule, NgClass, TranslateModule, CommonModule],
  animations:  [easeOut],
  templateUrl: './settings-p-security.component.html'
})

export class SettingsPSecurityComponent {
  email = '';
  currentEmail = '';
  oldPassword = '';
  newPassword = '';
  entered_token = '';
  token_2FA = '';
  confirmNewPassword = '';
  username= '';
  newToken= '';

  mailChanged = false;
  alreadyUsed = false;

  is_2FA_active = false;
  buttonClicked1 = false;
  buttonClicked2 = false;
 

  error = false;
  success = false;

  wrongPassword = false;
  passwordsMatch = false;
  passwordsMatchEmpty = false;
  passwordsMatchDuplicate = false;
  formSent = false;

  @Input() loaded: boolean = false;

  
  constructor(private settingsService: SettingsService, private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.authService.subscribe((userInfo : PrivateUserInfo | undefined) => {
      if (userInfo) {
        if (userInfo.tokentwofa && userInfo.twofa) {
          this.email = userInfo.email;
          this.currentEmail = this.email;
          this.is_2FA_active = userInfo.twofa;
          this.token_2FA = userInfo.tokentwofa;
          this.username = userInfo.info.username;
          this.newToken = ''
        }
        else{
          this.email = userInfo.email;
          this.currentEmail = this.email;
          this.username = userInfo.info.username;
          this.newToken = ''
        }
      }
    })
    console.log(this.currentEmail);
  }

  async saveMailSecurity() {
    this.mailChanged = false;
    this.alreadyUsed = false;

    try {
      await this.settingsService.send_mail_new_mail(this.email, this.currentEmail, this.username);
      await this.authService.setUserConfig({email : this.email});
      this.currentEmail = this.email;
    } catch (error: any) {
      console.error('❌ Oops!', error.status);
      if (error.status === 400) {
        this.alreadyUsed = true;
        return;
      }
    }
    this.mailChanged = true;
  }

  async savePassSecurity() {
    this.formSent = true;

    this.error = false;
    this.success = false;

    this.wrongPassword = false;
    this.passwordsMatchDuplicate = false;
    this.passwordsMatchEmpty = false;
    this.passwordsMatch = this.newPassword === this.confirmNewPassword;

    if (!this.passwordsMatch) {
      this.formSent = false;
      this.error = true;
      return;
    }

    try {
      await this.authService.verifyPassword(this.oldPassword);
      await this.authService.setUserConfig({password : this.newPassword});
    } catch (error: any) {
      this.error = true;
      const errorMsg = error.error.message;
      if (errorMsg.includes("empty")) { //La nueva contraseña no puede estar vacía.
        this.passwordsMatchEmpty = true;
      } else if (errorMsg.includes("not the same")) { //La contraseña actual no coincide.
        this.wrongPassword = true;
      } else if (errorMsg.includes("as the current")) { //La nueva contraseña no puede ser igual a la actual.
        this.passwordsMatchDuplicate = true;
      }
      this.formSent = false;
      return;
    }
    this.settingsService.send_mail_password(this.username)
    this.success = true;
    this.formSent = false;
  }

  async onButtonClick1True() {
      this.buttonClicked1 = true;
  }

  async onButtonClick1False() {
    this.buttonClicked1 = false;
    this.buttonClicked2 = false;
  }

  async sendmail() {
    await this.settingsService.send_mail_2FA_activation(this.username);
    this.buttonClicked2 = true;
  }

  async sendmail2() {
    await this.settingsService.send_mail_2FA_deactivation(this.username);
    this.is_2FA_active = false;
    this.buttonClicked1 = false;
  }

  async compareTwoFAToken() {
    await this.settingsService.check_token(this.entered_token, this.username);
    this.buttonClicked1 = false;
    this.buttonClicked2 = false;
    if (this.is_2FA_active == true){
      this.is_2FA_active = false;
    }
    else {
      this.is_2FA_active = true;
    }
  }
}






  





