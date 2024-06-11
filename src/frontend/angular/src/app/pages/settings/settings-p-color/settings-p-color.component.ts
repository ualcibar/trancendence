import { Component, Renderer2, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, PrivateUserInfo } from '../../../services/auth.service';
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
  username = 'Anonymous';

  constructor(public authService: AuthService, private renderer: Renderer2) {}

  ngOnInit() {
    this.authService.subscribe((userInfo : PrivateUserInfo | undefined) => {
      if (userInfo) {
        this.selected_colorId = userInfo.info.color;
        this.user_color = this.selected_colorId;
        this.username = userInfo.info.username;
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

  async saveColor() {
    try {
<<<<<<< HEAD
      await this.authService.setUserConfig({user_color : this.selected_colorId});
=======
      await this.authService.setUserConfig('color', this.selected_colorId);
>>>>>>> a16afc054244c6306261bb16f302d771a881725b
      this.user_color = this.selected_colorId;
    } catch (error) {
      console.error('❌ An error ocurred:', error);
    }
  }
}
