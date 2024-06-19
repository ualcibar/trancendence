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

import { SettingsService } from '../../services/settings.service';

import { easeOut } from "../../../assets/animations/easeOut";
import { Logger, LogFilter } from '../../utils/debug';

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

  activeTab: string | null = 'color';

  userId: number = 0;
  account42 = false;

  constructor (public authService: AuthService, private settingsService: SettingsService) { }

  ngOnInit() {
    this.authService.subscribe({
      next: (userInfo : PrivateUserInfo | undefined) => {
        if (userInfo) {
          this.tooLong = false;
          this.loading = false;
          this.userId = userInfo.info.id;
          this.account42 = userInfo.is_42_user;
        }
      },
    })
    if (this.loading) {
      setTimeout(() => {
        this.tooLong = true;
      }, 7000);
    }
    console.log('accoutn42: ', this.account42);
  }
}
