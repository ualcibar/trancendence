import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  username = "N/A";
  user_id = 0;
  total: any;
  wins: any;
  defeats: any;
  user_not_found = false;
  unauthorizedAccess = false;
  loading = true;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const userId = params['userId'];
      this.getUserInfo(userId);
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
        console.error('An error ocurred trying to contact the user authentification server: ', error.status);
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
