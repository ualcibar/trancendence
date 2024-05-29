import {Component, Input} from '@angular/core';
import { TranslateModule } from "@ngx-translate/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { SettingsService } from "../../../services/settings.service";
import {NgClass, NgIf} from "@angular/common";

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


  constructor(private settingsService: SettingsService) {
  }

  ngOnInit() {
    this.settingsService.userSettingsInfo$.subscribe(userSettingsInfo => {
      if (userSettingsInfo) {
        this.username = userSettingsInfo.username;
        this.currentUsername = this.username;
      }
    })
  }

  onFileChanged(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('Selected file:', file.name);
      // Process the file
    }
  }
  
  async savePublic() {
    try {
      await this.settingsService.setUserConfig('username', this.username);
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
