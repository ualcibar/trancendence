import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService, UserInfo } from '../../../services/auth.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  username = 'Loading...';
  user_id: number = 0;
  total: number = 0;
  wins: number = 0;
  defeats: number = 0;
  user_not_found = false;
  unauthorizedAccess = false;
  loading = true;
  editProfile = false;
  logged_username: any;

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthService) {}

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
  }

  getUserInfo(userId: number): void {
    const backendURL = 'api/polls/getInfo/' + userId;
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: (response) => {
        this.username = response['username'];
        this.user_id = response['userid'];
        this.total = response['total'];
        this.wins = response['wins'];
        this.defeats = response['defeats'];

        if (this.authService.user_info?.username === this.username) {
          this.editProfile = true;
        }
        this.loading = false;
        this.user_not_found = false;
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
}
