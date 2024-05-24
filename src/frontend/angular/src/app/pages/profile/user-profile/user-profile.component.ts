import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { FriendsService } from '../../../services/friends.service';

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
  logged_user_id: number = 0;
  user_color: string = "default";

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthService, private friendService: FriendsService) {}

  ngOnInit(): void {
    // Aquí obtenemos la última información del perfil del usuario
    this.authService.updateUserInfo();
    this.authService.isLoggedIn$.subscribe({
      next: (value) => {
        if (value) {
          this.route.params.subscribe(params => { // Esto hay que mirarlo, porquqe si lo del getUserInfo() falla por no estar con la sesión
            // iniciada, entonces se queda "cargando" infinitamente
            const userId = params['userId'];
            this.getUserInfo(userId);
            this.getLoggedUserInfo();
          });
        }
      }
    })
  }

  toggleAddFrined() {
    console.log('Im in profile:', this.user_id);
    console.log('Im the user', this.logged_user_id);
    console.log('Before');
    console.log(this.friendService.showFriendList(this.user_id));
    this.friendService.addFriend(this.user_id, this.logged_user_id);
    console.log('After');
    console.log(this.friendService.showFriendList(this.user_id));
  }

  getLoggedUserInfo(): void {
    const backendURL = 'api/polls/getInfo/';
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: (response) => {
      this.logged_user_id = response['userid'];
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
        this.user_color = response['color'];

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
}
