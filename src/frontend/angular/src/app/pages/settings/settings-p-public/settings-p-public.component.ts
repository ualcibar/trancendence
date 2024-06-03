import {Component, Input} from '@angular/core';
import { TranslateModule } from "@ngx-translate/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import { AuthService, PrivateUserInfo } from '../../../services/auth.service';

@Component({
  selector: 'app-settings-p-public',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    NgIf
  ],
  templateUrl: './settings-p-public.component.html',
  styleUrl: './settings-p-public.component.css'
})
export class SettingsPPublicComponent {
  username = '';
  currentUsername = '';
  alreadyUsed = false;
  nameChanged = false;

  @Input() loaded: boolean = false;


  constructor(private authService : AuthService) {
  }

  ngOnInit() {
    this.authService.subscribe((userInfo : PrivateUserInfo | undefined) => {
      if (userInfo) {
        this.username = userInfo.info.username;
        this.currentUsername = this.username;
      }
    })
  }

  async savePublic() {
    try {
      await this.authService.setUserConfig('username', this.username);
      this.alreadyUsed = false;
      this.nameChanged = true;
      this.currentUsername = this.username;
    } catch (error: any) {
      console.error('❌ Oops!', error.status);
      if (error.status === 400) {
        this.nameChanged = false;
        this.alreadyUsed = true;
      }
    }
  }
}
