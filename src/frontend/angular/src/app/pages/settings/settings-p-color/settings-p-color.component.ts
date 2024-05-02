import { Component, Renderer2, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { SettingsService } from '../../../services/settings.service';
import { SettingsComponent } from '../settings.component';

@Component({
  selector: 'app-settings-p-color',
  standalone: true,
  imports: [CommonModule, SettingsComponent],
  templateUrl: './settings-p-color.component.html',
  styleUrl: './settings-p-color.component.css'
})
export class SettingsPColorComponent {
  colorId: string = "default";
  selected_colorId: string = 'default';
  loading: boolean = true;

  @Input() loaded: boolean = false;

  constructor(public authService: AuthService, private renderer: Renderer2, public settingsService: SettingsService) {}

  ngOnInit() {
    setTimeout(() => {
      console.log("hola");
      this.selected_colorId = this.settingsService.user_settingsInfo?.user_color ?? 'default';
      this.colorId = this.settingsService.user_settingsInfo?.user_color ?? 'default';
      console.log(this.settingsService.user_settingsInfo?.user_color);
      this.loading = false;
    },100);
  }

  selectColor(color: string): void {
    ['default', 'rojo', 'naranja', 'ambar', 'lima', 'pino', 'purpura'].forEach(c => {
      this.renderer.removeClass(document.body, 'gradient-id-${c}');
    })
    this.renderer.addClass(document.body, 'gradient-id-${color}');
    this.colorId = color;
    this.selected_colorId = this.colorId;
  }

  selectColorBool(color: string): boolean {
    return this.selected_colorId === color;
  }

  saveColor() {
    this.settingsService.setUserConfig(this.colorId);
  }
}
