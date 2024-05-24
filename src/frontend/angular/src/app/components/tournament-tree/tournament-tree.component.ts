import { Component, Input,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentManager} from '../../services/gameManager.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tournament-tree-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './tournament-tree.component.html',
  styleUrl: './tournament-tree.component.css'
})
export class TournamentTreeComponent implements OnInit{
  @Input() manager! : TournamentManager;
  preview! : [string, string];

  constructor(private router : Router){}

  ngOnInit(){
    this.preview = this.manager.update.getNextMatchPreview();
  }
  start(){
    setTimeout(() => {
      this.router.navigate(['/play']);
      setTimeout(() => this.manager.start(), 1000);
    },3000);
  }

  getVs() : string{
    return `${this.manager.update.getNextMatchPreview()[0]} vs ${this.manager.update.getNextMatchPreview()[0]}`
  }
}
