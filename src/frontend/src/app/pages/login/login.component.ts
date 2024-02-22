import { Component} from '@angular/core';
import { Router} from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  user = {
    username: '',
    password: ''
  };

  errorMessage: string = '';
  successMessage: string = '';

  constructor(private http: HttpClient, private auth : AuthService, private router: Router) {}

  mostrarModal: boolean = false;
  imLoggedIn() {
    const backendURL = 'http://localhost:8000/polls/imLoggedIn';
    this.http.get<any>(backendURL, {withCredentials: true}).subscribe(
      response => {
        console.log('Sent data: ', response);
      },
      error => {
        console.error('An error ocurred trying to contact the registration server: ', error);
      }
    );
  }

  loginAcc() {
    const backendURL = 'http://localhost:8000/polls/login/';
    const jsonToSend = {
      username: this.user.username,
      password: this.user.password
    };

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type' : 'application/json'
      }),
      withCredentials: true
    };

    this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe(
      response => {
        console.log('Sent data: ', response);
        console.log('Response: ', response.sessionid);
        this.successMessage = response.message;
        this.auth.login();
        this.router.navigate(['/']);
      },
      error => {
        console.error('An error ocurred trying to contact the registration server: ', error);
        this.errorMessage = 'An error occurred: ' + error.message;
      }
    );
  }
}
