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

  entered_token = ''

  @Input() loaded: boolean = false;

  constructor(private http: HttpClient, private authService : AuthService) {}

  async check_2FA(){
    await this.authService.check_token_login(this.entered_token);
    this.authService.completeTwofa();
  }
}

