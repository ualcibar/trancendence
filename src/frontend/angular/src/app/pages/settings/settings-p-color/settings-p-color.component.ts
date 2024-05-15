import { Component, Renderer2, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { SettingsService } from '../../../services/settings.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-settings-p-color',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './settings-p-color.component.html',
  styleUrl: './settings-p-color.component.css'
})
export class SettingsPColorComponent {
  selected_colorId = 'default';
  user_color = 'default';

  @Input() loaded: boolean = false;

  constructor(public authService: AuthService, private renderer: Renderer2, public settingsService: SettingsService) {}

  ngOnInit() {
    this.settingsService.userSettingsInfo$.subscribe(userSettings => {
      if (userSettings) {
        this.selected_colorId = userSettings.user_color;
        this.user_color = this.selected_colorId;
      }
    })
  }

  selectColor(color: string): void {
    ['default', 'rojo', 'naranja', 'ambar', 'lima', 'pino', 'purpura'].forEach(c => {
      this.renderer.removeClass(document.body, 'gradient-id-${c}');
    })
    this.renderer.addClass(document.body, 'gradient-id-${color}');
    this.selected_colorId = color;
  }

  selectColorBool(color: string): boolean {
    return this.selected_colorId === color;
  }

  saveColor() {
    this.settingsService.setUserConfig('user_color', this.selected_colorId);
    this.user_color = this.selected_colorId;
  }
}
