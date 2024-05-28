import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, UnaryFunction, of} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';

export class UserInfo{
  id : number;
  username : string;
  online : boolean;
  //id: number;
  constructor (username : string, user_id : number, online : boolean){
    this.username = username;
    this.id = user_id;
    this.online = online;
  }
}

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  static friend_list : UserInfo[] = [];
  client_locale: string = 'en';
  friend_exit: boolean = false;
  
  constructor(private http: HttpClient, private router: Router, private authService: AuthService, private translateService: TranslateService) {
    this.authService.amILoggedIn();
    this.update_FriendList();
  }

  ngOnInit(): void {
    //this.update_FriendList();
  }

  update_FriendList(): void {
    const id = this.authService.user_info?.user_id;
    const url = `api/polls/friendslist/${id}/`;

    this.http.get<any>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log('update response friend list', response);
        FriendsService.friend_list = response;
     
      },
      error: () => {
        console.error('update friend list: error fetching data')
      }
    });
  }

  findFriend(friendsList: UserInfo[], friendId: number): UserInfo | null {
    for (const friend of FriendsService.friend_list) {
        if (friend.id == friendId) {
            return friend;
        }
    }
    return null
  }


  friendExist(friendId: number): boolean {
    console.log('friend-list in exist->', FriendsService.friend_list);
    if (this.findFriend(FriendsService.friend_list, friendId) != null || friendId == this.authService.user_info?.user_id) {
      console.log('yes');
      return true;
    }
    console.log('no');
    return false;
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
        FriendsService.friend_list = response.friends;
      },
      error: (error) => {
          console.error('cant add a friend:', error.status);
      }
  })
  }

}
