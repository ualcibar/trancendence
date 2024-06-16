import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, UnaryFunction, of} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { AuthService, UserInfo  } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  //friend_list : UserInfo[] = [];
  private friendListSubject: BehaviorSubject<UserInfo[]> = new BehaviorSubject<UserInfo[]>([]);
  friendList$: Observable<UserInfo[]> = this.friendListSubject.asObservable();
  
  constructor(private http: HttpClient, private router: Router, private authService: AuthService, private translateService: TranslateService) {

  }
  
  ngOnInit(): void {
  }

  findFriend(friendsList: UserInfo[] = [], friendId: number): UserInfo | null {
    for (const friend of friendsList) {
        if (friend.id == friendId) {
            return friend;
        }
    }
    return null
  }


  friendExist(friendId: number): boolean {
    if (this.findFriend(this.authService.userInfo?.friends, friendId) != null || friendId == this.authService.userInfo?.info.id) {
      return true;
    }
    return false;
  }

}