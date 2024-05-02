import { Component, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth.service';

import { SettingsPColorComponent } from './settings-p-color/settings-p-color.component';
import { UnauthorizedComponent } from '../../components/errors/unauthorized/unauthorized.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, SettingsPColorComponent, UnauthorizedComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  profileColorEdit: boolean = true;
  loading: boolean = true;

  constructor (private authService: AuthService) { }

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe({
      next: (value) => {
        if (value) {
          this.loading = false;
        }
      },
    })
  }
}
