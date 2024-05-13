import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService, UserInfo } from './auth.service';

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
  user_settingsInfo? : UserSettingsInfo;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.updateUserConfig();
  }

  // Inizializa la clase de ajustes de usuario y los guarda con los últimos datos disponibles de la clase 'UserInfo'
  updateUserConfig() {
    const currentUserInfo = this.authService.getUpdateUserInfo();
    if (currentUserInfo) {
      const backendURL = 'api/polls/getInfo';
      this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
        next: (response) => {
          this.user_settingsInfo = new UserSettingsInfo(currentUserInfo, response['color'], 'es');
        },
        error: () => {
          this.user_settingsInfo = undefined;
        }
      });
    }
  }

  // Esta función nos permite actualizar datos de usuario utilizanddo la view del backend
  setUserConfig(color: string) {
    const backendURL = '/api/polls/setConfig/' + this.user_settingsInfo?.user_id;
    const httpReqBody = { color: color };
    const httpHeader = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    this.http.post<any>(backendURL, httpReqBody, httpHeader).subscribe({
      next: (response) => {
        if (this.user_settingsInfo) {
          this.user_settingsInfo.user_color = color;
        }
        console.log('|?| Respuesta del backend:', response);
      },
      error: (error) => {
        console.log('|x| Algo no ha ido bien en el backend:', error);
      }
    });
  }
}
