import { Component, Input } from '@angular/core';
import { TranslateModule } from "@ngx-translate/core";

import { AuthService } from "../../../services/auth.service";

@Component({
  selector: 'app-settings-p-privacy',
  standalone: true,
  templateUrl: './settings-p-privacy.component.html',
  imports: [TranslateModule]
})
export class SettingsPPrivacyComponent {
  @Input() loaded: boolean = false;

  constructor(private authService: AuthService) {
  }

  async anonymizeData() {
    try {
      await this.authService.setUserConfig({anonymise: ""});
    } catch (error: any) {
      console.error('❌ Oops!', error.message);
    }
    this.authService.logout();
  }

  async deleteUser() {
    try {
      await this.authService.delete();
      window.location.href = "/";
    } catch (error: any) {
      console.error('❌ Oops!', error.message);
    }
  }
}
