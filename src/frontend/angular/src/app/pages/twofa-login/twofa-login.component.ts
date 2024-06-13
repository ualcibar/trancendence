import { Component, Input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgClass, CommonModule } from '@angular/common';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { easeOut } from '../../../assets/animations/easeOut';

@Component({
  selector: 'app-twofa-login',
  standalone: true,
  imports: [TranslateModule, NgClass, CommonModule, FormsModule],
  animations: [easeOut],
  templateUrl: './twofa-login.component.html',
  styleUrl: './twofa-login.component.css'
})

export class TwofaLoginComponent {
  user = {
    entered_token: ''
  };

  @Input() loaded: boolean = false;

  constructor(private http: HttpClient, private authService : AuthService) {}
  
  async check_token_login(token: string, user:string): Promise<void> {
    const backendURL = 'api/polls/check_token_login/';
    const httpReqBody = `currentToken=${token}&currentUsername=${user}`;
    const httpHeader = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };
    const response = await firstValueFrom(this.http.post<any>(backendURL, httpReqBody, httpHeader));
    console.log('✔️ ', response.message);
  }

  async check_2FA(username: string){
    await this.check_token_login(this.user.entered_token, username);
    this.authService.completeTwofa();
  }
}

