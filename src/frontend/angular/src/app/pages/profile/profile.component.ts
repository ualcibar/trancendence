import { Component, OnInit} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit{
  constructor(private http: HttpClient){}
  username = "anonimous";
  getInfo() {
    const backendURL = 'api/polls/getInfo';
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe(
      response => {
        this.username = response['username'];
      },
      error => {
        console.error('An error ocurred trying to contact the registration server: ', error);
      }
    );
  }
  ngOnInit(): void {
      this.getInfo();
  }
}