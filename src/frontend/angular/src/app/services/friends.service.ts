import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, UnaryFunction, of} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';

export class UserInfo{
  user_id : number;
  username : string;
  online : boolean;
  constructor (username : string, user_id : number, online : boolean){
    this.username = username;
    this.user_id = user_id;
    this.online = online;
  }
}

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  //user_info? : UserInfo;

  friend_list : UserInfo[] = [];
  client_locale: string = 'en';

  constructor(private http: HttpClient, private router: Router, private authService: AuthService, private translateService: TranslateService) {
    this.authService.amILoggedIn();
  }

  update_FriendList(): void {
    const id = this.authService.user_info?.user_id;
    const url = `api/polls/friendslist/${id}/`;

    this.http.get<any>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log('response friend list', response);
        this.friend_list = response;
      },
      error: () => {
        console.error('update friend list: error fetching data')
      }
    });
  }

  addFriend(friendId: number): void {
    const url = `api/polls/friends/${this.authService.user_info?.user_id}/${friendId}/`;

    const jsonToSend = { 

  };

    const httpOptions = {
      headers: new HttpHeaders({
          'Content-Type' : 'application/json'
      }),
  };

    this.http.post<any>(url, jsonToSend, httpOptions).subscribe({
      next: (response) => {

      },
      error: (error) => {
          console.error('cant add a friend:', error.status);
      }
  })
  }

}
