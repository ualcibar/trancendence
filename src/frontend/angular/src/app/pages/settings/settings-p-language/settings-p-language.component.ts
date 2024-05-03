import { Component, Renderer2, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { SettingsService } from '../../../services/settings.service';
import { SettingsComponent } from '../settings.component';

@Component({
  selector: 'app-settings-p-language',
  standalone: true,
  imports: [CommonModule, SettingsComponent],
  templateUrl: './settings-p-language.component.html',
  styleUrl: './settings-p-language.component.scss'
})
export class SettingsPLanguageComponent {
  lang: string = "default";
  selected_lang: string = 'default';
  loading: boolean = true;

  @Input() loaded: boolean = false;

  constructor(public authService: AuthService, private renderer: Renderer2, public settingsService: SettingsService) {}

  ngOnInit() {
    setTimeout(() => {
      console.log("hola");
      this.selected_lang = this.settingsService.user_settingsInfo?.user_language ?? 'en';
      this.lang = this.settingsService.user_settingsInfo?.user_language ?? 'en';
      console.log(this.settingsService.user_settingsInfo?.user_language);
      this.loading = false;
    },100);
  }

  selectLanguage(color: string): void {
    ['en', 'es', 'eus'].forEach(c => {
      this.renderer.removeClass(document.body, 'gradient-id-${c}');
    })
    this.renderer.addClass(document.body, 'gradient-id-${color}');
    this.lang = color;
    this.selected_lang = this.lang;
  }

  selectLanguageBool(color: string): boolean {
    return this.selected_lang === color;
  }

  saveLanguage() {
    this.settingsService.setUserConfig(this.lang);
  }
}
