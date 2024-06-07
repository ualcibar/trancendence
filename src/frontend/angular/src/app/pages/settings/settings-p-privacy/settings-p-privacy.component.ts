import { Component, Input } from '@angular/core';
import { TranslateModule } from "@ngx-translate/core";

import { SettingsService } from "../../../services/settings.service";
import { AuthService } from "../../../services/auth.service";

@Component({
  selector: 'app-settings-p-privacy',
  standalone: true,
    imports: [
        TranslateModule
    ],
  templateUrl: './settings-p-privacy.component.html',
  styleUrl: './settings-p-privacy.component.css'
})
export class SettingsPPrivacyComponent {
  @Input() loaded: boolean = false;

  constructor(private settingsService: SettingsService, private authService: AuthService) {
  }

  async anonymizeData() {
    try {
      await this.settingsService.setUserConfig('anonymise', "");
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
