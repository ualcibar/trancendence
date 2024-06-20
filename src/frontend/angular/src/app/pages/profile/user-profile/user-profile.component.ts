import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, HostListener, NgZone, Renderer2 } from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';

import { AuthService, PrivateUserInfo, UserInfo } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

import { easeOut } from "../../../../assets/animations/easeOut";
import { UnauthorizedComponent } from '../../../components/errors/unauthorized/unauthorized.component';
import { NotFoundComponent } from '../../../components/errors/not-found/not-found.component';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatchHistoryComponent } from '../matchHistory/match-history.component';
import { ChatComponent } from '../../../components/chat/chat.component';
import { FriendsService } from '../../../services/friends.service';
import { FriendListComponent } from '../../../components/friend-list/friend-list.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  animations: [easeOut],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  imports: [
    UnauthorizedComponent,
    NotFoundComponent,
    CommonModule,
    TranslateModule,
    MatchHistoryComponent,
    FriendListComponent,
    ChatComponent,
    RouterLink
  ]
})
export class UserProfileComponent implements OnInit{
  selfInfo : PrivateUserInfo | undefined;
  info? : UserInfo | undefined; 
  showMatchHistory: boolean = false;
  showChat : boolean = false;
  user_not_found: boolean = false;
  unauthorizedAccess: boolean = false;

  loading: boolean = true;
  tooLong: boolean = false;

  editProfile: boolean = false;
  last_login = 'todo'

  userId : number = -1;
  friendADD: boolean = false;
  showFriendList: boolean =false;

  userBlocked = false;
  private subscription: Subscription | undefined;

  constructor(private http: HttpClient, private route: ActivatedRoute, public authService: AuthService, private elRef: ElementRef, private ngZone: NgZone, private router : Router, private renderer: Renderer2, public friendService: FriendsService) {
  }

  ngOnInit(): void {
    this.authService.subscribe((userInfo : PrivateUserInfo | undefined) => {
        if (userInfo) {
          this.selfInfo = userInfo;
          this.route.params.subscribe(params => {
            console.log(params)
            this.userId = params['userId'];
            console.log('blocked',this.authService.isUserBlocked(this.userId), 'id', this.userId)
            this.getUserInfo(this.userId);
            this.editProfile = this.userId === userInfo.info.id
          });
        }
        else{
          //this.router.navigate(['/'])
        }
      }
    );
    if (this.loading) {
      setTimeout(() => {
        this.tooLong = true;
      }, 7000);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
     this.ngZone.run(() => {
      console.log('resize')
      this.applyStyles(window.innerWidth);
    });
  }

  private applyStyles(viewportWidth: number) {
    const containerElement = this.elRef.nativeElement.querySelector('.profileMain');
    if (viewportWidth < 1300 && (this.showMatchHistory || this.showChat)) {
      this.renderer.addClass(containerElement, 'small-width');
    } else {
      this.renderer.removeClass(containerElement, 'small-width');
    }
  }

  blockUser(){
    this.authService.blockUser(this.userId)
    this.userBlocked = true
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

        this.loading = false;
        if (this.authService.userInfo!.info.username === this.info?.username) {
          this.editProfile = true;
        } else if (this.info?.username === "admin") {
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

  toggleAddFriend() {;
    this.authService.addFriend(this.userId);
    this.friendADD = true;
  }

  onFriendListButton() {
    this.showFriendList = !this.showFriendList
    if (this.showFriendList){
      this.showChat = false
      this.showMatchHistory = false
    }
    this.applyStyles(window.innerWidth)
  }
  
  onMatchHistoryButton(){
    this.showMatchHistory = !this.showMatchHistory
    if (this.showMatchHistory){
      this.showChat = false
      this.showFriendList = false
    }
    this.applyStyles(window.innerWidth)
  }
  onChatButton(){
    this.showChat = !this.showChat
    if (this.showChat){
      this.showMatchHistory = false
      this.showFriendList = false
    }
    this.applyStyles(window.innerWidth)
  }
}
