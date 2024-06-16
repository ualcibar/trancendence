import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService, PrivateUserInfo, UserInfo } from '../../../services/auth.service';

import { FriendsService } from '../../../services/friends.service';
import { easeOut } from "../../../../assets/animations/easeOut";
import { UnauthorizedComponent } from '../../../components/errors/unauthorized/unauthorized.component';
import { NotFoundComponent } from '../../../components/errors/not-found/not-found.component';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FriendListComponent } from '../../../components/friend-list/friend-list.component';

@Component({
  selector: 'app-user-profile',
  animations: [easeOut],
  standalone: true,
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  imports: [UnauthorizedComponent, NotFoundComponent, CommonModule, TranslateModule, FriendListComponent]
})
export class UserProfileComponent {
  info? : UserInfo | undefined;
  friendADD: boolean = false;
  showFriendList: boolean = false;
  logged_username: any;
  userId : number = -1;
  //user_color: string = "default";
  user_not_found: boolean = false;
  unauthorizedAccess: boolean = false;
  last_login: string = "none";

  loading: boolean = true;
  tooLong: boolean = false;

  editProfile: boolean = false;

  constructor(private http: HttpClient, private route: ActivatedRoute, public authService: AuthService, public friendService: FriendsService) {}

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

  }

  toggleAddFriend() {;
    this.authService.addFriend(this.userId);
    this.friendADD = true;
  }

  onFriendListButton() {
    if (this.showFriendList == false)
    {
      this.showFriendList = true;
    } else 
    {
      this.showFriendList = false;
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
