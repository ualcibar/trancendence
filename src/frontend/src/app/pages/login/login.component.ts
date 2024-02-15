import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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

  constructor(private http: HttpClient) {}

  mostrarModal: boolean = false;

  mostrarToast() {
    this.mostrarModal = true;
    console.log("lol");
  }

  cerrarModal() {
    this.mostrarModal = false;
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
      })
    };

    this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe(
      response => {
        console.log('Sent data: ', response);
        this.successMessage = response.message;
      },
      error => {
        console.error('An error ocurred trying to contact the registration server: ', error);
        this.errorMessage = 'An error occurred: ' + error.message;
      }
    );
  }
}
