import { Component, Renderer2, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { SettingsService, UserSettingsInfo } from '../../../services/settings.service';
import { SettingsComponent } from '../settings.component';

@Component({
  selector: 'app-settings-p-language',
  standalone: true,
  imports: [CommonModule, SettingsComponent],
  templateUrl: './settings-p-language.component.html',
  styleUrl: './settings-p-language.component.scss'
})
export class SettingsPLanguageComponent {
  lang = 'en';
  selected_lang: string = 'default';
  loading: boolean = true;

  @Input() loaded: boolean = false;

  constructor(public authService: AuthService, private renderer: Renderer2, public settingsService: SettingsService) {}

  ngOnInit() {
    this.settingsService.userSettingsInfo$.subscribe(userSettingsInfo => {
      if (userSettingsInfo) {
        this.selected_lang = userSettingsInfo.user_language;
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
    this.settingsService.setUserConfig(this.lang);
  }
}
