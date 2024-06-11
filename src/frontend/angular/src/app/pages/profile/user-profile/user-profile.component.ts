import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService, PrivateUserInfo, UserInfo } from '../../../services/auth.service';

import { easeOut } from "../../../../assets/animations/easeOut";

@Component({
  selector: 'app-user-profile',
  animations: [easeOut],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  info? : UserInfo | undefined;
  user_not_found: boolean = false;
  unauthorizedAccess: boolean = false;
  last_login: string = "none";

  loading: boolean = true;
  tooLong: boolean = false;

  editProfile: boolean = false;

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.subscribe({
      next: (userInfo : PrivateUserInfo) => {
        if (userInfo) {
          this.route.params.subscribe(params => {
            const userId = params['userId'];
            this.getUserInfo(userId);
          });
        }
      }
    })
    if (this.loading) {
      setTimeout(() => {
        this.tooLong = true;
      }, 7000);
    }
  }

  getUserInfo(userId: number): void {
    const backendURL = 'api/polls/getInfo/' + userId;
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: (response) => {
        const info = UserInfo.fromI(response.userInfo)
        if (!info){
          this.user_not_found = true;
          console.error('failed to parse user info')
        }
        this.info = info;
        this.last_login = response.last_login;

        this.loading = false;
        if (this.authService.userInfo!.info.username === this.info?.username)
          this.editProfile = true;
        else this.user_not_found = this.info?.username === "admin";
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
