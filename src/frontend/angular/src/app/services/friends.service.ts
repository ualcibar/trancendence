import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, UnaryFunction, of} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

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
  private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  user_info? : UserInfo;
  isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  client_locale: string = 'en';

  constructor(private http: HttpClient, private router: Router, private translateService: TranslateService) {
  }
}
