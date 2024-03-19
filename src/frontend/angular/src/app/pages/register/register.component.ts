import { Component, OnInit} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
    user = {
        username: '',
        password: ''
    };

    errorMessage: string = '';
    successMessage: string = '';

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        console.log("unai sucks");//so true
    }

    register42Api() {
        window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-8aae85ebafbe4fc02b48f3c831107662074a15fe99a907cac148d3e42db1cd87&redirect_uri=http%3A%2F%2Flocalhost%3A4200&response_type=code&state=register';
    }

    registerAcc() {
        const backendURL = '/api/polls/register/';
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
                this.successMessage = response.message;
            },
            error => {
                console.error('An error ocurred trying to contact the registration server:', error.status);
                this.errorMessage = error.error.reason;
            }
        );
    }
}
