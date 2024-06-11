import { Component, Input } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AuthService, PrivateUserInfo } from '../../../services/auth.service';

import {easeOut} from "../../../../assets/animations/easeOut";

@Component({
  selector: 'app-settings-p-security',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass],
  animations:  [easeOut],
  templateUrl: './settings-p-security.component.html',
  styleUrl: './settings-p-security.component.scss'
})
export class SettingsPSecurityComponent {
  email = '';
  currentEmail = '';
  oldPassword = '';
  newPassword = '';
  confirmNewPassword = '';

  mailChanged = false;
  alreadyUsed = false;

  error = false;
  success = false;

  wrongPassword = false;
  passwordsMatch = false;
  passwordsMatchEmpty = false;
  passwordsMatchDuplicate = false;
  formSent = false;

  @Input() loaded: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.subscribe((userInfo : PrivateUserInfo | undefined) => {
      if (userInfo) {
        this.email = userInfo.email;
        this.currentEmail = this.email;
      }
    })
  }

  async saveMailSecurity() {
    this.mailChanged = false;
    this.alreadyUsed = false;

    try {
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
      return;
    }

    try {
      await this.authService.verifyPassword(this.oldPassword);
      await this.authService.setUserConfig({password :  this.newPassword});
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
}
