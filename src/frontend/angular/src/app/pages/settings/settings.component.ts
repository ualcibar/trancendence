import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService, PrivateUserInfo } from '../../services/auth.service';

import { SettingsPColorComponent } from './settings-p-color/settings-p-color.component';
import { SettingsPLanguageComponent } from './settings-p-language/settings-p-language.component';
import { SettingsPPublicComponent } from "./settings-p-public/settings-p-public.component";
import { SettingsPSecurityComponent } from './settings-p-security/settings-p-security.component';
import { SettingsPPrivacyComponent } from './settings-p-privacy/settings-p-privacy.component';
import { UnauthorizedComponent } from '../../components/errors/unauthorized/unauthorized.component';
import { TranslateModule } from '@ngx-translate/core';

import { easeOut } from "../../../assets/animations/easeOut";

@Component({
  selector: 'app-settings',
  standalone: true,
  animations: [easeOut],
  imports: [CommonModule, SettingsPColorComponent, SettingsPLanguageComponent, SettingsPPublicComponent, SettingsPSecurityComponent, SettingsPPrivacyComponent, UnauthorizedComponent, RouterModule, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  loading: boolean = true;
  tooLong: boolean = false;

  activeTab: string | null =  'color';

  constructor (public authService: AuthService) { }

  ngOnInit() {
    this.authService.subscribe({
      next: (userInfo : PrivateUserInfo | undefined) => {
        if (userInfo) {
          this.tooLong = false;
          this.loading = false;
        }
      },
    })
    if (this.loading) {
      setTimeout(() => {
        this.tooLong = true;
      }, 7000);
    }
  }
}
