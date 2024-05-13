import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService, UserInfo } from './auth.service';
import { BehaviorSubject, Observable } from 'rxjs';

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
          const userSettingsInfo = new UserSettingsInfo(currentUserInfo, response['color'], 'es');
          this.userSettingsInfoSubject.next(userSettingsInfo);
          console.log("lol");
        },
        error: () => {
          this.userSettingsInfoSubject.next(null);
        }
      });
    }
  }

  // Esta función nos permite actualizar datos de usuario utilizanddo la view del backend
  setUserConfig(color: string) {
    const userSettingsInfoVal = this.userSettingsInfoSubject.getValue();
    if (userSettingsInfoVal) {
      const backendURL = '/api/polls/setConfig/' + userSettingsInfoVal.user_id;
      const httpReqBody = { color: color };
      const httpHeader = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      };

      this.http.post<any>(backendURL, httpReqBody, httpHeader).subscribe({
        next: (response) => {
          userSettingsInfoVal.user_color = color;
          console.log('|?| Respuesta del backend:', response);
        },
        error: (error) => {
          console.log('|x| Algo no ha ido bien en el backend:', error);
        }
      });
    } else {
      console.log('|x| Ha ocurrido un error al establecer la configuración en el servicio de Settings de Usuario');
      return;
    }
  }
}
