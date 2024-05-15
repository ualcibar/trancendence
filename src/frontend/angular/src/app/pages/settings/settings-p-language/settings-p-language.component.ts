import { Component, Renderer2, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-settings-p-language',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-p-language.component.html',
  styleUrl: './settings-p-language.component.scss'
})
export class SettingsPLanguageComponent {
  selected_lang = 'en';
  user_lang = 'en';

  @Input() loaded: boolean = false;

  constructor(public authService: AuthService, public settingsService: SettingsService) {}

  ngOnInit() {
    this.settingsService.userSettingsInfo$.subscribe(userSettingsInfo => {
      if (userSettingsInfo) {
        this.selected_lang = userSettingsInfo.user_language;
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

  saveLanguage() {
    this.settingsService.setUserConfig('user_language', this.selected_lang);
    this.user_lang = this.selected_lang;
  }
}
