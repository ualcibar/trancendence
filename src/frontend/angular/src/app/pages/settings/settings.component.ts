import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';

import { SettingsPColorComponent } from './settings-p-color/settings-p-color.component';
import { SettingsPLanguageComponent } from './settings-p-language/settings-p-language.component';
import { SettingsPPublicComponent } from "./settings-p-public/settings-p-public.component";
import { UnauthorizedComponent } from '../../components/errors/unauthorized/unauthorized.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, SettingsPColorComponent, SettingsPLanguageComponent, SettingsPPublicComponent, UnauthorizedComponent, RouterModule, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  loading: boolean = true;

  activeTab: string | null =  'public';

  constructor (public authService: AuthService) { }

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
