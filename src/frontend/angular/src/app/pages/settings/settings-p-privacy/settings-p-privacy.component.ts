import { Component, Input } from '@angular/core';
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'app-settings-p-privacy',
  standalone: true,
    imports: [
        TranslateModule
    ],
  templateUrl: './settings-p-privacy.component.html',
  styleUrl: './settings-p-privacy.component.css'
})
export class SettingsPPrivacyComponent {
  @Input() loaded: boolean = false;
}
