import { Component, Input,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentManager} from '../../services/gameManager.service';
import { State } from '../../utils/state';
import { Observable } from 'rxjs';

class TreeRender{
    renderVs : State<boolean> = new State<boolean>(false);
    renderWinner : State<boolean> = new State<boolean>(false);

    get vs$() : Observable<boolean> {return this.renderVs.observable};
    get winner$() : Observable<boolean> {return this.renderWinner.observable};
}
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

  constructor(){}

  ngOnInit(){
    this.preview = this.manager.update.getNextMatchPreview();
  }

  getVs() : string{
    return `${this.preview[0]} vs ${this.preview[1]}`
  }
}
