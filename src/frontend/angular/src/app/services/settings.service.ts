import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService, UserInfo } from './auth.service';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

// Esta clase nos permite guardar/obtener la config custom del usuario
// - Para obtener todos los valores, implementamos la clase 'UserInfo' del servicio de 'Auth'
export class UserSettingsInfo extends UserInfo {
  user_color: string;
  user_language: string;
  user_email: string;
  user_tokentwofa:string;
  user_username:string;
  user_twofa: boolean;
  user_active: boolean;

  constructor (userInfo: UserInfo, user_color: string, user_language: string, user_email: string, user_twofa: boolean, user_tokentwofa: string, user_active: boolean, user_username: string) {
    super(userInfo.username, userInfo.user_id, userInfo.online);
    this.user_color = user_color;
    this.user_language = user_language;
    this.user_email = user_email;
    this.user_twofa = user_twofa;
    this.user_tokentwofa = user_tokentwofa;
    this.user_active = user_active;
    this.user_username = user_username;
  }
}

@Injectable({
  providedIn: 'root'
})

export class SettingsService {
  private userSettingsInfoSubject: BehaviorSubject<UserSettingsInfo | null> = new BehaviorSubject<UserSettingsInfo | null>(null);
  userSettingsInfo$: Observable<UserSettingsInfo | null> = this.userSettingsInfoSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService, private translateService: TranslateService) {
    this.updateUserConfig();
  }

  // Inizializa la clase de ajustes de usuario y los guarda con los últimos datos disponibles de la clase 'UserInfo'
  updateUserConfig() {
    const currentUserInfo = this.authService.getUpdateUserInfo();
    if (currentUserInfo) {
      const backendURL = 'api/polls/getInfo';
      this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
        next: (response) => {
          const userSettingsInfo = new UserSettingsInfo(currentUserInfo, response['color'], response['language'], response['email'], response['twofa'], response['tokentwofa'], response['is_active'], response['username']);
          this.userSettingsInfoSubject.next(userSettingsInfo);
        },
        error: () => {
          this.userSettingsInfoSubject.next(null);
        }
      });
    } else {
      console.log('|x| Ha ocurrido un error al establecer la configuración en el servicio de Settings de Usuario');
      return;
    }
  }

  // Esta función nos permite actualizar datos de usuario utilizanddo la view del backend
  async setUserConfig(type: string, value: string): Promise<void> {
    const userSettingsInfoVal = this.userSettingsInfoSubject.getValue();
    if (userSettingsInfoVal) {
      const backendURL = '/api/polls/setConfig/' + userSettingsInfoVal.user_id;
      const httpReqBody = { [type]: value };
      const httpHeader = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      };

      const response = await firstValueFrom(this.http.post<any>(backendURL, httpReqBody, httpHeader));
      if (type === 'user_language') {
        userSettingsInfoVal.user_language = value;
      } else if (type === 'user_color') {
        userSettingsInfoVal.user_color = value;
      } else if (type === 'username') {
        userSettingsInfoVal.username = value;
      } else if (type === 'anonymize') {
        userSettingsInfoVal.user_active = false;
      } else if (type == 'tokentwofa') {
        userSettingsInfoVal.user_tokentwofa = value;
      }
      console.log('✔️ ', response);
    } else {
      console.error('❌ Ha ocurrido un error al establecer la configuración en el servicio de Settings de Usuario');
      return;
    }
  }

  async setUserConfigBool(type: string, value: boolean): Promise<void> {
    const userSettingsInfoVal = this.userSettingsInfoSubject.getValue();
    if (userSettingsInfoVal) {
      const backendURL = '/api/polls/setConfig/' + userSettingsInfoVal.user_id;
      const httpReqBody = { [type]: value };
      console.log('httpReqBody', httpReqBody)
      const httpHeader = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      };

      const response = await firstValueFrom(this.http.post<any>(backendURL, httpReqBody, httpHeader));
      if (type === 'user_twofa') {
        userSettingsInfoVal.user_twofa = value;
      } 
      console.log('✔️ ', response.message);
      console.log(userSettingsInfoVal.username);
    } else {
      console.error('❌ Ha ocurrido un error al establecer la configuración en el servicio de Settings de Usuario');
      return;
    }
  }
  //Esta función permite comprobar que la contraseña actual sea la correcta
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

  async send_mail(mail: string, user:string): Promise<void> {
    const backendURL = 'api/polls/send_mail/';
    const httpReqBody = `currentMail=${mail}&currentUsername=${user}`;
    const httpHeader = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };
    const response = await firstValueFrom(this.http.post<any>(backendURL, httpReqBody, httpHeader));
    console.log('✔️ ', response.message);
  }

  async check_token(token: string, user:string): Promise<void> {
    const backendURL = 'api/polls/check_token/';
    const httpReqBody = `currentToken=${token}&currentUsername=${user}`;
    const httpHeader = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };
    const response = await firstValueFrom(this.http.post<any>(backendURL, httpReqBody, httpHeader));
    console.log('✔️ ', response.message);
  }

  async get_2FA_bool(user:string): Promise<void> {
    const backendURL = 'api/polls/get_2FA_bool/';
    const httpReqBody = `currentUsername=${user}`;
    const httpHeader = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };
    const response = await firstValueFrom(this.http.post<any>(backendURL, httpReqBody, httpHeader));
    console.log('✔️ ', response.message);
  }
}
