import { Injectable } from '@angular/core';
import {Observable, Subscription, firstValueFrom, shareReplay} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { LogFilter, Logger } from '../utils/debug';
import { State } from '../utils/state';
import { toEnum } from '../utils/help_enum';

export interface LighUserInfoI{
  id : number;
  username : string;
  status : string;
}

export class LightUserInfo{
  id : number;
  username : string;
  status : UserStatus;
  constructor (username : string, id : number, status : UserStatus){
    this.username = username;
    this.id = id;
    this.status = status;
  }
  static fromI(values : LighUserInfoI){
    const status = toEnum(UserStatus, values.status);
    if (!status)
      return undefined
    return new LightUserInfo(values.username, values.id, status)
  }
}

export interface UserInfoI extends LighUserInfoI{
  color : string;
  wins : number;
  loses : number;
  avatarUrl : string;
}

enum UserStatus{
  Connected = 'Connected',
  Disconnected = 'Disconnected',
  JoiningGame = 'JoiningGame',
  InGame = 'InGame',
}

export class UserInfo{
  id : number;
  username : string;
  status : string;
  color : string;
  wins : number;
  loses : number;
  avatarUrl : string;

  constructor (username : string, user_id : number, status : UserStatus, color : string,wins:number ,loses:number, avatarUrl : string){
    this.username = username;
    this.id = user_id;
    this.status = status;
    this.color = color;
    this.wins = wins;
    this.loses = loses;
    this.avatarUrl = avatarUrl;
  }

  static fromI(values : UserInfoI) : UserInfo | undefined{
    //console.log('status', values.status)
    const status = toEnum(UserStatus, values.status);
    if (!status){
      console.error('user info: fromI: failed to parse status enum:', values.status)
      return undefined
    }
    return new UserInfo(values.username, values.id, status, values.color, values.wins, values.loses, values.avatarUrl)
  }
}

export interface PrivateUserInfoI{ 
  info : UserInfo;
  friends : UserInfoI[];
  language : string;
  email : string;
  last_login : string;
}

export class PrivateUserInfo{
  info : UserInfo;
  friends : UserInfo[];
  language : string;
  email : string;
  last_login : string;

  constructor (info: UserInfo, friends: UserInfo[], language: string, email: string, last_login: string){
    this.info = info;
    this.friends = friends;
    this.email = email;
    this.language = language;
    this.last_login = last_login;
  }
  static fromI(values : PrivateUserInfoI) : PrivateUserInfo | undefined{
    
    const friends : UserInfo[] = [];
    for (const friend of values.friends){
      const info = UserInfo.fromI(friend)
      if (!info)
        return undefined
      friends.push(info)
    }
    const userInfo = UserInfo.fromI(values.info)
    if (!userInfo)
      return undefined
    return new PrivateUserInfo(userInfo, friends, values.language, values.email, values.last_login)
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _userInfo : State<PrivateUserInfo | undefined>;

  //logger*
  private logger : Logger = new Logger(LogFilter.AuthServiceLogger, 'auth service:')

  constructor(private http: HttpClient, private router: Router, private translateService: TranslateService) {
    this._userInfo = new State<PrivateUserInfo | undefined>(undefined);
    this.refreshToken()
  
  }

  get amIloggedIn() : boolean{
    if (!(this._userInfo instanceof State)){
      return false;
    }
    return this._userInfo.getCurrentValue() !== undefined
  }

  get userInfo() : PrivateUserInfo | undefined{
    return this._userInfo.getCurrentValue()
  }
  get userInfo$() : Observable<PrivateUserInfo | undefined>{
    return this._userInfo.observable;
  }

  subscribe(fn : any) : Subscription{
    return this._userInfo.subscribe(fn);
  }

  // Función para obtener los datos del usuario en el momento en el que sea llamada
  // - Debajo, el Getter para poder ser utilizado por el servicio de 'Settings'
  updateUserInfo() {
    const backendURL = 'api/polls/getInfo';
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: (response) => {
        //console.log('auth log1', response.privateUserInfo)
        //console.log('auth log2', PrivateUserInfo.fromI(response.privateUserInfo))
        //console.log('status type', typeof PrivateUserInfo.fromI(response.privateUserInfo)?.info.status)
        //console.log('status should be', typeof UserStatus.Connected)
        this.translateService.setDefaultLang(response.privateUserInfo.language);
        this.translateService.use(response.privateUserInfo.language);
        this._userInfo.setValue(PrivateUserInfo.fromI(response.privateUserInfo))
      },
      error: () => {
        this._userInfo.setValue(undefined)
      }
    });
  }

  updateFriendList(friendID: number){
    if (!this.amIloggedIn){
      this.logger.error('update user info: userinfo is undefined')
      return
    }
    const backendURL = `api/polls/friends/${this.userInfo!.info.id}/`;
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: (response) => {
        this.logger.info('response friend list', response);
      },
      error: () => {
        this.logger.error('update update friend list: error fetching data')
        this.updateUserInfo()
      }
    });
  }

  addFriend(friendID: number){
    if (!this.amIloggedIn){
      this.logger.error('update user info: userinfo is undefined')
      return
    }
    const backendURL = `api/polls/friendsID/${this.userInfo!.info.id}/${friendID}/`;
    const jsonToSend = {
    };
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    this.http.post<any>(backendURL, jsonToSend).subscribe({
      next: (response) => {
        this.logger.info('friend added', response.friends);
      },
      error: (error) => {
        console.error('cant add a friend:', error.status);
    }
    });
  }

  registerAcc(username : string, password : string, email : string) : Observable<any> {
    this.logger.info('registering', username)
    const backendURL = '/api/polls/register/';
    const jsonToSend = {
      username: username,
      password: password,
      email: email
    };

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type' : 'application/json'
      }),
    };

    const register$ = this.http.post<any>(backendURL, jsonToSend, httpOptions).pipe(
      shareReplay(1)
    )
    register$.subscribe({
      next: (response) => {
        this.logger.info('successful register')
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (error) => {
        this.logger.error('An error ocurred registering this account:', error.message);
      }
    })
    return register$;
  }

  async login(username : string, password : string): Promise<void> {
    const backendURL = 'api/polls/login/';
    const jsonToSend = {
      username: username,
      password: password
    };
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    const response = await firstValueFrom(this.http.post<any>(backendURL, jsonToSend, httpOptions));
    const privateUserInfo : PrivateUserInfo = response.privateUserInfo;
    if (privateUserInfo === undefined)
      console.error('private user info: ', privateUserInfo)
    console.log('info',this._userInfo, 'type', typeof this._userInfo)
    this._userInfo.setValue(privateUserInfo);
    console.info("✔️ You've successfully logged in. Welcome!");
  }

  logout() {
    const backendURL = 'api/polls/logout/';
    this.http.post<any>(backendURL, {},{withCredentials: true}).subscribe({
      next: (response) => {
        console.log('Sent data: ', response);
      },
      error: (error) => {
        console.error('An error ocurred trying to contact the registration server: ', error);
      }
    });

    var accessToken = localStorage.getItem('access_token');
    this._userInfo.setValue(undefined);
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 500)
  }

  async delete(): Promise<void> {
    const backendURL = '/api/polls/delete';

    await firstValueFrom(this.http.delete<any>(backendURL));
    console.info("✔️ Account deletion processed. Thank you for playing SpacePong!");
  }

  refreshToken(){
    console.info('Refresh token called');
    const refresh = this.getCookie('refresh_token');
    if (refresh === null){
      console.warn("Couldn't find the refresh token. Are you logged in?")
      this._userInfo.setValue(undefined);
      return;
    }
    const backendURL = 'api/polls/token/refresh/';
    this.http.post<any>(backendURL, {refresh : refresh},{}).subscribe({
      next: (response) => {
        this.logger.info('success refresh?', response);
        this.updateUserInfo();
      },
      error: () => {
       this.logger.error('failed refresh token')
       this._userInfo.setValue(undefined);
      }
    });
  }

  getCookie(name: string): string | null {
    const nameLenPlus = (name.length + 1);
    return document.cookie
      .split(';')
      .map(c => c.trim())
      .filter(cookie => {
        return cookie.substring(0, nameLenPlus) === `${name}=`;
      })
      .map(cookie => {
        return decodeURIComponent(cookie.substring(nameLenPlus));
      })[0] || null;
  }

  //
  // User Config Management functions
  //
  async setUserConfig(content : any): Promise<void> {
    if (this.userInfo) {
      const backendURL = '/api/polls/setConfig/' + this.userInfo.info.id;
      const httpReqBody = content;
      const httpHeader = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      };

      const response = await firstValueFrom(this.http.post<any>(backendURL, httpReqBody, httpHeader));
      this._userInfo.setValue(response.privateUserInfo);
    } else {
      this.logger.error('❌ Ha ocurrido un error al establecer la configuración en el servicio de Settings de Usuario');
      return;
    }
  }

  async verifyPassword(value: string): Promise<void> {
    const backendURL = '/api/polls/checkInfo/';
    const httpReqBody = `currentPass=${value}`;
    const httpHeader = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };

    const response = await firstValueFrom(this.http.post<any>(backendURL, httpReqBody, httpHeader));
    console.log('✔️ ', response.message);
  }
}
