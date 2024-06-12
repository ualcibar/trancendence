import { Component, Renderer2, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, PrivateUserInfo, UserInfo } from '../../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-settings-p-color',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './settings-p-color.component.html',
  styleUrl: './settings-p-color.component.css'
})
export class SettingsPColorComponent {
  avatarUrl? : string;
  selected_colorId : string = 'default';
  user_color : string = 'default';

  @Input() loaded: boolean = false;
  username : string =  'Anonymous';

  constructor(public authService: AuthService, private renderer: Renderer2) {}

  ngOnInit() {
    this.authService.subscribe((userInfo : PrivateUserInfo | undefined) => {
      if (userInfo) {
        this.selected_colorId = userInfo.info.color;
        this.user_color = this.selected_colorId;
        this.username = userInfo.info.username;
        this.avatarUrl = userInfo.info.avatarUrl;
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
      await this.authService.setUserConfig({color : this.selected_colorId});
      this.user_color = this.selected_colorId;
    } catch (error) {
      console.error('❌ An error ocurred:', error);
    }
  }
}
