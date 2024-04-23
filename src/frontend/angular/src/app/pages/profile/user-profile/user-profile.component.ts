import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  username = 'Loading...';
  user_id: any;
  total: any;
  wins: any;
  defeats: any;
  user_not_found = false;
  unauthorizedAccess = false;
  loading = true;
  editProfile = false;

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const userId = params['userId'];
      this.getUserInfo(userId);
      console.log(this.authService.user_id);
      console.log(userId);
      if (this.authService.user_id === userId) { // Esto hay que revisarlo
        console.log("lol");
        this.editProfile = true;
      }
    });
  }

  getUserInfo(userId: number): void {
    const backendURL = 'api/polls/getInfo/' + userId;
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe(
      response => {
        this.username = response['username'];
        this.user_id = response['userid'];
        this.total = response['total'];
        this.wins = response['wins'];
        this.defeats = response['defeats'];
        this.loading = false;
        this.user_not_found = false;
      },
      error => {
        console.error('An error ocurred fetching this user: ', error.status);
        this.loading = false;
        if (error.status === 404) {
          this.user_not_found = true;
        } else {
          this.unauthorizedAccess = true;
        }
      }
    );
  }
}
