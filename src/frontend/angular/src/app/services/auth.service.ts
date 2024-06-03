import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, UnaryFunction, of} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { LogFilter, Logger } from '../utils/debug';

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
export class AuthService {
  private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  user_info? : UserInfo;
  isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();
  friends? : UserInfo[];

  //logger
  logger : Logger = new Logger(LogFilter.AuthServiceLogger, 'auth service:')
  client_locale: string = 'en';

  constructor(private http: HttpClient, private router: Router, private translateService: TranslateService) {
    this.amILoggedIn();
  }

  // Función para obtener los datos del usuario en el momento en el que sea llamada
  // - Debajo, el Getter para poder ser utilizado por el servicio de 'Settings'
  updateUserInfo() {
    const backendURL = 'api/polls/getInfo';
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: (response) => {
        this.user_info = new UserInfo(response['username'], response['userid'], true);
        this.isLoggedInSubject.next(true);
        this.translateService.setDefaultLang(response['language']);
        this.translateService.use(response['language']);
      },
      error: () => {
        this.user_info = undefined;
      }
    });
  }

  updateFriendList(){
    if (!this.user_info){
      this.logger.error('update user info: userinfo is undefined')
      return
    }
    const backendURL = `api/polls/friends/${this.user_info.user_id}/`;
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: (response) => {
        this.logger.info('response friend list', response);
      },
      error: () => {
        this.user_info = undefined;
        this.logger.error('update friend list: error fetching data')
      }
    });
  }

  addFriend(){
    if (!this.user_info){
      this.logger.error('update user info: userinfo is undefined')
      return
    }
    const backendURL = `api/polls/friends/${this.user_info.user_id}/`;
    const jsonToSend = {
      usernames : ['nice']
    };
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    this.http.post<any>(backendURL, jsonToSend).subscribe({
      next: (response) => {
        this.logger.info('response friend list', response);
      },
      error: () => {
        this.user_info = undefined;
        this.logger.error('update friend list: error fetching data')
      }
    });
  }

  getUpdateUserInfo(): UserInfo | undefined {
    console.log(this.user_info?.username);
    return this.user_info;
  }

  amILoggedIn(){
    let backendURL = 'api/polls/imLoggedIn';
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: () => {
        this.logger.info("|!| You are logged in!")
        this.updateUserInfo();
      },
      error: () => {
        this.client_locale = navigator.language.substring(0,2);
        this.translateService.setDefaultLang(this.client_locale);
        this.translateService.use(this.client_locale);
        this.refreshToken();
      }
    })
  }

  isLoggedIn() : boolean{
   return this.isLoggedInSubject.value; 
  }

  login(username : string, password : string) : Promise<boolean>{
    return new Promise<boolean>((value) => {
      try { 
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

        this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe({
          next: () => {
            this.isLoggedInSubject.next(true);
            value(true);
          },
          error: () => {
            value(false);
          }
        });
      } catch (error) {
        console.error('An error occurred while contacting the registration server:');
        value(false);
      }
    });
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
    this.isLoggedInSubject.next(false);
    setTimeout(() => {
      this.router.navigate(['/']);
      window.location.href="/";
    }, 500)
  }

  refreshToken(){
    console.log('refresh token has been called in auth');
    const refresh = this.getCookie('refresh_token');
    if (refresh === null){
      console.error('cant find refresh token')
      this.isLoggedInSubject.next(false);
      //return new Promise<boolean>(()=>false);
    }
    const backendURL = 'api/polls/token/refresh/';
    this.http.post<any>(backendURL, {refresh : refresh},{}).subscribe({
      next: (response) => {
        this.logger.info('success refresh?', response);
        this.updateUserInfo();
        
        //this.amILoggedIn();
      },
      error: () => {
       // return false;
       this.logger.error('failed refresh token')
       this.isLoggedInSubject.next(false);
      }
    });
    //return new Promise<boolean>(() => false);
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
}
