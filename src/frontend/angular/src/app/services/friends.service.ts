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

  //friend_list : UserInfo[] = [];
  private friendListSubject: BehaviorSubject<UserInfo[]> = new BehaviorSubject<UserInfo[]>([]);
  friendList$: Observable<UserInfo[]> = this.friendListSubject.asObservable();
  id : any = 0;
  client_locale: string = 'en';
  
  constructor(private http: HttpClient, private router: Router, private authService: AuthService, private translateService: TranslateService) {
    this.authService.amILoggedIn();
    this.id = this.authService.user_info?.user_id
    this.authService.isLoggedIn$.subscribe((value) => {
      if (value == true) {
        this.id = this.authService.user_info!.user_id; 
        this.update_FriendList();
      }
      })
    console.log('id ', this.id);
  }
  
  ngOnInit(): void {
  }

  update_FriendList(): void {
    const id = this.authService.user_infoSubject.value.user_id;
    const url = `api/polls/friendslist/${id}/`;
    console.log('stoy updateando');
    this.http.get<any>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log('update response friend list', response);
        this.friendListSubject.next(response);
     
      },
      error: () => {
        console.error('update friend list: error fetching data')
      }
    });
  }

  findFriend(friendsList: UserInfo[], friendId: number): UserInfo | null {
    for (const friend of this.friendListSubject.getValue()) {
        if (friend.id == friendId) {
            return friend;
        }
    }
    return null
  }


  friendExist(friendId: number): boolean {
    console.log('friend-list in exist->', this.friendListSubject.getValue());
    if (this.findFriend(this.friendListSubject.getValue(), friendId) != null || friendId == this.authService.user_info?.user_id) {
      console.log('yes');
      return true;
    }
    console.log('no');
    return false;
  }

  addFriend(friendId: number): void {
    const url = `api/polls/friends/${this.authService.user_infoSubject.value.user_id}/${friendId}/`;

    const jsonToSend = { 

  };

    const httpOptions = {
      headers: new HttpHeaders({
          'Content-Type' : 'application/json'
      }),
  };

    this.http.post<any>(url, jsonToSend, httpOptions).subscribe({
      next: (response) => {
        this.friendListSubject.next(response.friends);
      },
      error: (error) => {
          console.error('cant add a friend:', error.status);
      }
  })
  }

}
