import { Component, Renderer2, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { SettingsService } from '../../../services/settings.service';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-settings-p-two-fa',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './settings-p-two-fa.component.html',
  styleUrl: './settings-p-two-fa.component.css'
})
export class SettingsPTwoFAComponent {

  username = 'Loading...';
  user_id: number = 0;
  user_not_found = false;
  is_2FA_active = false;
  loading = true;
  editProfile = false;
  unauthorizedAccess = false;

  constructor(public authService: AuthService, private renderer: Renderer2, public settingsService: SettingsService ,private http: HttpClient, private route: ActivatedRoute) {}

  @Input() loaded: boolean = false;

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe({
      next: (value) => {
        if (value) {
          this.route.params.subscribe(params => { // Esto hay que mirarlo, porquqe si lo del getUserInfo() falla por no estar con la sesión
            // iniciada, entonces se queda "cargando" infinitamente
            const userId = params['userId'];
            this.getUserInfo(userId);
          });
        }
      }
    })
    this.settingsService.userSettingsInfo$.subscribe(userSettings => {
      if (userSettings) {
        this.is_2FA_active = userSettings.is_2FA_active;
      }
    })
  }

  getUserInfo(userId: number): void {
    const backendURL = 'api/polls/getInfo/' + userId;
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: (response) => {
        this.username = response['username'];
        this.user_id = response['userid'];
        this.is_2FA_active = response['is_2FA_active']

        this.loading = false;
        if (this.authService.user_info?.username === this.username) {
          this.editProfile = true;
        } else if (this.username === "admin") {
          this.user_not_found = true;
        } else {
          this.user_not_found = false;
        }
      },
      error: (error) => {
        console.error('An error ocurred fetching this user: ', error.status);
        this.loading = false;
        if (error.status === 404) {
          this.user_not_found = true;
        } else {
          this.unauthorizedAccess = true;
        }
      }
    })
  }

  saveTwoFAStatus(userId: number): void {
    const newStatus = true;
    this.settingsService.updateTwoFAStatus(this.user_id, newStatus).subscribe({
      next: (response) => {
        console.log('TwoFA status updated successfully', response);
        this.is_2FA_active = newStatus;
      },
      error: (error) => {
        console.error('Error updating TwoFA status', error);
      }
    })
  }
}
