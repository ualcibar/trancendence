import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AuthService, PrivateUserInfo } from '../../../services/auth.service';

@Component({
  selector: 'app-settings-p-security',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './settings-p-security.component.html',
  styleUrl: './settings-p-security.component.css'
})
export class SettingsPSecurityComponent {
  email = '';
  currentEmail = '';
  password = '';

  mailChanged = false;
  alreadyUsed = false;

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

  async saveSecurity() {
    try {
      await this.authService.setUserConfig({email : this.email});
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
}
