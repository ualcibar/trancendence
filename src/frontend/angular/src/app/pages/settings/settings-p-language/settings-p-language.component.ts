import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, PrivateUserInfo } from '../../../services/auth.service';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-settings-p-language',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './settings-p-language.component.html',
  styleUrl: './settings-p-language.component.scss'
})
export class SettingsPLanguageComponent {
  selected_lang = 'en';
  user_lang = 'en';

  @Input() loaded: boolean = false;

  constructor(public authService: AuthService, private translateService: TranslateService) {}

  ngOnInit() {
    this.authService.subscribe((userInfo : PrivateUserInfo | undefined )=> {
      if (userInfo) {
        this.selected_lang = userInfo.language;
        this.user_lang = this.selected_lang;
      }
    });
  }

  selectLanguage(lang: string): void {
    this.selected_lang = lang;
  }

  selectLanguageBool(lang: string): boolean {
    return this.selected_lang === lang;
  }

  async saveLanguage() {
    try {
      await this.authService.setUserConfig({language : this.selected_lang});
      localStorage.setItem('lang', this.selected_lang);
      this.translateService.use(this.selected_lang);
      this.user_lang = this.selected_lang;
    } catch (error: any) {
      console.error('❌ An error ocurred:', error);
    }
  }
}
