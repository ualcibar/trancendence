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

  constructor (userInfo: UserInfo, user_color: string, user_language: string) {
    super(userInfo.username, userInfo.user_id, userInfo.online);
    this.user_color = user_color;
    this.user_language = user_language;
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
          const userSettingsInfo = new UserSettingsInfo(currentUserInfo, response['color'], response['language']);
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

      try {
        const response = await firstValueFrom(this.http.post<any>(backendURL, httpReqBody, httpHeader));
          if (type === 'user_language') {
            userSettingsInfoVal.user_language = value;
          } else if (type === 'user_color') {
            userSettingsInfoVal.user_color = value;
          } else if (type === 'username') {
            userSettingsInfoVal.username = value;
          }
          console.log('✔️ ', response.message);
      } catch (error) {
        throw error;
      }
    } else {
      console.error('❌ Ha ocurrido un error al establecer la configuración en el servicio de Settings de Usuario');
      return;
    }
  }
}
