import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, UnaryFunction, of} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

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

  constructor(private http: HttpClient) {
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
      },
      error: () => {
        this.user_info = undefined;
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
        console.log("|!| You are logged in!")
        this.updateUserInfo();
      },
      error: () => {
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
    // Logic to perform logout
    //if (accessToken) {
    //  localStorage.removeItem('access_token');
    //  localStorage.removeItem('refresh_token');
    //}
    this.isLoggedInSubject.next(false);
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
        console.log('success refresh?', response);
        this.updateUserInfo();
        
        //this.amILoggedIn();
      },
      error: () => {
       // return false;
       console.error('failed refresh token')
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
