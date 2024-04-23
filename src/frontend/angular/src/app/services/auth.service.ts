import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, of} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

export class UserInfo{
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
  username: any;
  user_id: any;

  constructor(private http: HttpClient) {
    this.amILoggedIn(); 
    const backendURL = 'api/polls/getInfo';
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe(
      (response) => {
        this.userinfo = new UserInfo(response['username'], true);
      },
      (error) => {
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

  getUserId(): Promise<number> {
    const backendURL = 'api/polls/getInfo';
    return new Promise((resolve, reject) => {
      this.http.get<any>(backendURL, { withCredentials: true }).subscribe(
        response => {
          console.log(response['userid']);
        },
        error => {
          reject(error.status);
        }
      );
    })
  }

  async ngOnInit() {
    this.isLoggedInSubject.next(await this.amILoggedIn());
  }

  async amILoggedIn(): Promise<boolean>{
    let backendURL = 'api/polls/imLoggedIn';
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe(
      (response) => {
        console.log('im logged in');
        this.isLoggedInSubject.next(true);
        return true;
      },
      (error) => {
        this.refreshToken().then(value => {
          this.isLoggedInSubject.next(value);
          return value;
        }
      );
      }
    )
    return false;
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

        this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe(
          (response) => {
            this.isLoggedInSubject.next(true);
            value(true);
          },
          (error) => {
            value(false);
          }
        );
      } catch (error) {
        console.error('An error occurred while contacting the registration server:');
        value(false);
      }
    });
    /* 
    const backendURL = '/api/polls/login/';
    const jsonToSend = {
      username: username,
      password: password
    };

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type' : 'application/json'
      }),
      withCredentials: false 
    };

    this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe(
      response => {
        return true;
        this.successMessage = response.message;
        this.router.navigate(['/']);
        this.isLoggedInSubject.next(true);
      },
      error => {
        return false;
        console.error('An error ocurred trying to contact the registration server:', error.status);
        this.errorMessage = error.error.message;
      }
    );*/
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

  refreshToken() : Promise<boolean>{
    console.log('refresh token has been called in auth');
    const refresh = this.getCookie('refresh_token');
    if (refresh === null){
      console.error('cant find refresh token')
      return new Promise<boolean>(()=>false);
    }
    const backendURL = 'api/polls/token/refresh/';
    this.http.post<any>(backendURL, {refresh : refresh},{}).subscribe(
      response => {
        console.log('success refresh?', response);
        return this.amILoggedIn();
      },
      error => {
        return false;
      }
    );
    return new Promise<boolean>(() => false);
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
