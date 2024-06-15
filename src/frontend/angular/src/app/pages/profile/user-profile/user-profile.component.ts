import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Input, OnInit, HostListener, NgZone, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService, PrivateUserInfo, UserInfo } from '../../../services/auth.service';

import { easeOut } from "../../../../assets/animations/easeOut";
import { UnauthorizedComponent } from '../../../components/errors/unauthorized/unauthorized.component';
import { NotFoundComponent } from '../../../components/errors/not-found/not-found.component';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { MatchHistoryComponent } from '../matchHistory/match-history.component';
import { ChatComponent } from '../../../components/chat/chat.component';

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
    ChatComponent]
})
export class UserProfileComponent implements OnInit{
  selfInfo : PrivateUserInfo | undefined;
  info? : UserInfo | undefined; 
  showMatchHistory: boolean = false;
  showChat : boolean = false;
  user_not_found: boolean = false;
  unauthorizedAccess: boolean = false;
  last_login: string = "none";

  loading: boolean = true;
  tooLong: boolean = false;

  editProfile: boolean = false;

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthService, private elRef: ElementRef, private ngZone: NgZone,  private renderer: Renderer2) {
  }

  ngOnInit(): void {
    this.authService.subscribe({
      next: (userInfo : PrivateUserInfo) => {
        if (userInfo) {
          this.selfInfo = userInfo;
          this.route.params.subscribe(params => {
            console.log(params)
            const userId = params['userId'];
            this.getUserInfo(userId);
            this.editProfile = userId === userInfo.info.id
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

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
     this.ngZone.run(() => {
      console.log('resize')
      this.applyStyles(window.innerWidth);
    });
  }

  private applyStyles(viewportWidth: number) {
    const containerElement = this.elRef.nativeElement.querySelector('.container');
    if (viewportWidth < 1300 && (this.showMatchHistory || this.showChat)) {
      this.renderer.addClass(containerElement, 'small-width');
    } else {
      this.renderer.removeClass(containerElement, 'small-width');
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
  onMatchHistoryButton(){
    this.showMatchHistory = !this.showMatchHistory
    if (this.showMatchHistory)
      this.showChat = false
    this.applyStyles(window.innerWidth)
  }
  onChatButton(){
    this.showChat = !this.showChat
    if (this.showChat)
      this.showMatchHistory = false
    this.applyStyles(window.innerWidth)
  }
}
