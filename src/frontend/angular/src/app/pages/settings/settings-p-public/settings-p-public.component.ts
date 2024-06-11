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
  avatarUrl = '';
  currentAvatarUrl = '';

  @Input() loaded: boolean = false;


  constructor(private authService : AuthService) {
    this.authService.subscribe((userInfo : PrivateUserInfo | undefined) => {
      if (userInfo) {
        this.username = userInfo.info.username;
        this.currentUsername = this.username;
        this.currentAvatarUrl = userInfo.info.avatarUrl;
        this.avatarUrl = userInfo.info.avatarUrl;
      }
    })
  }

  ngOnInit() {
  }

  async savePublic() {
    try {
      const data = {}
      if (this.username !== this.currentUsername && this.currentAvatarUrl !== this.avatarUrl)
        await this.authService.setUserConfig({username: this.username, avatarUrl : this.avatarUrl});
      else if (this.username !== this.currentUsername)
        await this.authService.setUserConfig({username: this.username});
      else if (this.avatarUrl !== this.currentAvatarUrl)
        await this.authService.setUserConfig({avatarUrl: this.avatarUrl});
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
  onSelectFile(event : any) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();

      reader.readAsDataURL(event.target.files[0]); // read file as data url

      reader.onload = (event) => { // called once readAsDataURL is completed
        if (!event.target || typeof event.target.result !== 'string'){
          console.error('failed to load image')
          return
        }
        this.avatarUrl = event.target.result;
        console.log('url', this.avatarUrl)
      }
    }
  }
}
