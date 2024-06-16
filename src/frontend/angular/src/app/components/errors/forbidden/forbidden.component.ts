import { Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './forbidden.component.html',
  styleUrl: '../not-found/not-found.component.css'
})
export class ForbiddenComponent {

}
