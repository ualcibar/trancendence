import { Component, Input} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, CommonModule } from '@angular/common';
import { SettingsService } from '../../../services/settings.service';
import { AuthService } from '../../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {easeOut} from "../../../../assets/animations/easeOut";

@Component({
  selector: 'app-settings-p-security',
  standalone: true,
  imports: [FormsModule, NgClass, TranslateModule, CommonModule],
  animations:  [easeOut],
  templateUrl: './settings-p-security.component.html',
  styleUrl: './settings-p-security.component.scss'
})

export class SettingsPSecurityComponent {
  email = '';
  currentEmail = '';
  oldPassword = '';
  newPassword = '';
  entered_token = '';
  token_2FA = '';
  confirmNewPassword = '';

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
    this.settingsService.userSettingsInfo$.subscribe(data => {
      if (data) {
        this.email = data.user_email;
        this.currentEmail = this.email;
        this.is_2FA_active = data.user_twofa;
        this.token_2FA = data.user_tokentwofa;
      }
    })
  }

  async saveMailSecurity() {
    this.mailChanged = false;
    this.alreadyUsed = false;

    try {
      await this.settingsService.setUserConfig('email', this.email);
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
      return;
    }

    try {
      await this.settingsService.verifyPassword(this.oldPassword);
      await this.settingsService.setUserConfig('password', this.newPassword);
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
    this.success = true;
    this.formSent = false;
  }

  async saveTwoFAStatus() {
    try {
      const new2FAStatus = !this.is_2FA_active;
      await this.settingsService.setUserConfigBool('user_twofa', new2FAStatus);
      this.is_2FA_active = new2FAStatus;
    } catch (error: any) {
      console.error('❌ Error updating 2FA status:', error);
    }
  }

  async onButtonClick1True() {
      this.buttonClicked1 = true;
  }

  async onButtonClick1False() {
    this.buttonClicked1 = false;
    this.buttonClicked2 = false;
  }

  async send_mail(): Promise<void> {
    console.log('sending a mail here: ', this.email);
    const backendURL = 'api/polls/send_mail/';
    const httpReqBody = `currentMail=${this.email}`;
    const httpOptions = {
      headers: new HttpHeaders({
          'Content-Type': 'application/json'
      })
    };
    this.http.post<any>(backendURL, httpReqBody, httpOptions);
    this.buttonClicked2 = true;
  }

  async compareTwoFAToken() {
    console.log('comparing entered token: ', this.entered_token);
    console.log('to actual token: ', this.token_2FA);
    if (this.entered_token == this.token_2FA){
    //this.saveTwoFAStatus();
    this.buttonClicked1 = false;
    }
    else{
      console.log('try again ig idk');
    }
  }
}






  





