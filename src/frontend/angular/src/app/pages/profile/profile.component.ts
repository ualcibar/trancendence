import { Component, OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit{
  constructor(private http: HttpClient){}
  username = "N/A";
  forbiddenAccess = false;
  loading = true;

  getInfo() {
    const backendURL = 'api/polls/getInfo';
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe(
      response => {
        this.username = response['username'];
        this.loading = false;
      },
      error => {
        console.error('An error ocurred trying to contact the user authentification server: ', error.status);
        this.forbiddenAccess = true;
        this.loading = false;
      }
    );
  }
  ngOnInit(): void {
      this.getInfo();
  }
}