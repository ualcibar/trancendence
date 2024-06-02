import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { SettingsService } from '../../../services/settings.service';
import { AuthService } from '../../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

/* import { HttpClient, HttpHeaders } from '@angular/common/http';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs'; */

@Component({
  selector: 'app-settings-p-security',
  standalone: true,
  imports: [FormsModule, NgClass, TranslateModule],
  templateUrl: './settings-p-security.component.html',
  styleUrl: './settings-p-security.component.css'
})
export class SettingsPSecurityComponent {
  email = '';
  currentEmail = '';
  oldPassword = '';
  newPassword = '';

  mailChanged = false;
  alreadyUsed = false;

  is_2FA_active = false;

  @Input() loaded: boolean = false;

  constructor(/* private http: HttpClient,  */private settingsService: SettingsService, private authService: AuthService) {}

  ngOnInit() {
    this.settingsService.userSettingsInfo$.subscribe(data => {
      if (data) {
        this.email = data.user_email;
        this.currentEmail = this.email;
        this.is_2FA_active = data.user_twofa;
      }
    })
  }

  async saveMailSecurity() {
    try {
      await this.settingsService.setUserConfig('email', this.email);
      this.currentEmail = this.email;
      this.alreadyUsed = false;
      this.mailChanged = true;
    } catch (error: any) {
      console.error('❌ Oops!', error.status);
      if (error.status === 400) {
        this.mailChanged = false;
        this.alreadyUsed = true;
      }
    }
  }

  async savePassSecurity() {
    try {
      await this.settingsService.setUserConfig('password', this.newPassword);
    } catch (error: any) {
      if (error.status === 400) {
        
      }
    }
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
}