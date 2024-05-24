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
  user_info? : UserInfo;

  client_locale: string = 'en';

  constructor(private http: HttpClient, private router: Router, private authService: AuthService, private translateService: TranslateService) {
    this.authService.amILoggedIn();
  }

  showFriendList(userId: number): Observable<any> {
    const url = `api/polls/friendslist/${userId}/`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log(url);
    // Assuming you might want to send some data in the body of the POST request
    const body = { /* some data if needed */ };

    return this.http.get(url, body);
    
  }

  addFriend(userId: number, friendId: number): Observable<any> {
    const url = `api/polls/friends/${userId}/${friendId}/`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log(url);
    // Assuming you might want to send some data in the body of the POST request
    const body = { /* some data if needed */ };

    return this.http.post(url, body, { headers });
  }

}
