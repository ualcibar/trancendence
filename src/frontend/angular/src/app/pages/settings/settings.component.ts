import { Component, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth.service';

import { SettingsPColorComponent } from './settings-p-color/settings-p-color.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, SettingsPColorComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  profileColorEdit: boolean = false;
}
