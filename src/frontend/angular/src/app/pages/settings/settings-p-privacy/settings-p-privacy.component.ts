import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-settings-p-privacy',
  standalone: true,
  imports: [],
  templateUrl: './settings-p-privacy.component.html',
  styleUrl: './settings-p-privacy.component.css'
})
export class SettingsPPrivacyComponent {
  @Input() loaded: boolean = false;
}
