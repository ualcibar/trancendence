import { Injectable, OnInit} from '@angular/core';
import { BehaviorSubject, Observable, of} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

class UserInfo{
  username : string;
  online : boolean;
  constructor (username : string, online : boolean){
    this.username = username;
    this.online = online;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnInit{
  private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  userinfo : UserInfo = new UserInfo('guest', true);
  isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
    this.amILoggedIn().subscribe(value => {
      this.isLoggedInSubject.next(value);
    });
    const backendURL = 'api/polls/getInfo';
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe(
      response => {
        this.userinfo = new UserInfo(response['username'], true);
      },
      error => {
        this.userinfo =  new UserInfo('guest', true);
      }
    );
  }

  updateUserInfo(){
    const backendURL = 'api/polls/getInfo';
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe(
      response => {
        this.userinfo = new UserInfo(response['username'], true);
      },
      error => {
        this.userinfo =  new UserInfo('guest', true);
      }
    );
  }

  ngOnInit() {
    this.amILoggedIn().subscribe(value => {
      this.isLoggedInSubject.next(value);
    });
  }

  amILoggedIn(): Observable<boolean>{
    const backendURL = 'api/polls/imLoggedIn';
    return this.http.get<any>(backendURL, { withCredentials: true })
      .pipe(
        map(response => true), // Map successful response to true
        catchError(error => of(false)) // Catch errors and map to false
      );
  }

  login(){
    this.isLoggedInSubject.next(true);
  }

  logout() {
    const backendURL = 'api/polls/logout/';
    this.http.post<any>(backendURL, {},{withCredentials: true}).subscribe(
      response => {
        console.log('Sent data: ', response);
      },
      error => {
        console.error('An error ocurred trying to contact the registration server: ', error);
      }
    );
    var accessToken = localStorage.getItem('access_token');
    // Logic to perform logout
    if (accessToken) {
      localStorage.removeItem('access_token');
    }
    this.isLoggedInSubject.next(false);
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
