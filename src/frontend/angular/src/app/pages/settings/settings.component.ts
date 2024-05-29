import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { MatchmakingService } from '../../services/matchmaking.service';

import { SettingsPColorComponent } from './settings-p-color/settings-p-color.component';
import { SettingsPLanguageComponent } from './settings-p-language/settings-p-language.component';
import { SettingsPPublicComponent } from "./settings-p-public/settings-p-public.component";
import { SettingsPSecurityComponent } from './settings-p-security/settings-p-security.component';
import { SettingsPPrivacyComponent } from './settings-p-privacy/settings-p-privacy.component';
import { UnauthorizedComponent } from '../../components/errors/unauthorized/unauthorized.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, SettingsPColorComponent, SettingsPLanguageComponent, SettingsPPublicComponent, SettingsPSecurityComponent, SettingsPPrivacyComponent, UnauthorizedComponent, RouterModule, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  loading: boolean = true;

  activeTab: string | null =  'security';

  constructor (public authService: AuthService, private matchmakingService: MatchmakingService) { }

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe({
      next: (value) => {
        if (value) {
          this.loading = false;
        }
      },
    })
  }
}
