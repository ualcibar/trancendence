import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NgClass, CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.css'
})

export class VerifyComponent {
  token: string = '';
  user: string = '';
  requestData: any;
  ver_bool: boolean = false;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.user = params['user'] || '';
      this.verify_mail(this.token, this.user);
    });
  }

  async verify_mail(token: string, user:string): Promise<void> {
    const backendURL = 'api/polls/verify_mail/';
    const httpReqBody = {
      encripted_token: token,
      encripted_username : user
    };
    const httpHeader = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    try {
      const response = await firstValueFrom(this.http.post<any>(backendURL, httpReqBody, httpHeader));
      console.log('✔️ ', response.message);
      this.ver_bool = true;
    } catch (error) {
      console.error('Error fetching data:', error);
      this.ver_bool = false;
    }
  }
}
