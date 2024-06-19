import {Component, Input} from '@angular/core';
import { TranslateModule } from "@ngx-translate/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgClass, NgIf, NgOptimizedImage } from "@angular/common";
import { AuthService, PrivateUserInfo } from '../../../services/auth.service';
import { easeOut } from "../../../../assets/animations/easeOut";
import { ip } from '../../../../main';

@Component({
  selector: 'app-settings-p-public',
  standalone: true,
  animations: [easeOut],
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    NgIf,
    NgOptimizedImage
  ],
  templateUrl: './settings-p-public.component.html'
})
export class SettingsPPublicComponent {
  username = '';
  currentUsername = '';
  alreadyUsed = false;
  nameChanged = false;
  defaultAvatarSet = false;

  fileUploaded: boolean = false;
  avatarChanged: boolean = false;
  avatarUrl = '';
  currentAvatarUrl = '';
  wrongFileType: boolean = false;

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

  async savePublic() {
    try { 
      await this.authService.setUserConfig({username: this.username});
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

  async saveAvatar() {
    this.avatarChanged = false;
    this.wrongFileType = false;
    try {
      if (this.defaultAvatarSet)
        await this.authService.setUserConfig({avatarUrl : 'default'});
      else
        await this.authService.setUserConfig({avatarUrl : this.avatarUrl});
    } catch (error: any) {
      console.error('❌ Oops!', error.status);
      if (error.status === 413) {
        this.wrongFileType = true;
        return;
      }
    }
    this.avatarChanged = true;
    this.fileUploaded = false;
    this.defaultAvatarSet = false;
  }
  
  async defaultAvatar(){
    this.avatarUrl = `https://${ip}:1501/api/media/avatars/default.jpg`
    this.defaultAvatarSet = true;
    this.fileUploaded = true;
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
        this.fileUploaded = true;
        this.avatarUrl = event.target.result;
        console.log('url', this.avatarUrl)
      }
    }
  }

  removeSelectedFile() {
    const actualBtn = document.getElementById('avatar-upload') as HTMLInputElement;
    const fileChosen = document.getElementById('file-chosen') as HTMLInputElement;

    actualBtn.value = '';
    fileChosen.style.display = 'none';
    this.avatarUrl = this.currentAvatarUrl;
    this.fileUploaded = false;
    this.defaultAvatarSet = false;
  }
}
