import { Component, Input,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentManager, TournamentSettings} from '../../services/gameManager.service';
import { State } from '../../utils/state';
import { Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

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
    CommonModule, FormsModule, TranslateModule
  ],
  templateUrl: './tournament-tree.component.html',
  styleUrl: './tournament-tree.component.css'
})
export class TournamentTreeComponent implements OnInit{
  @Input() manager! : TournamentManager;
  @Input() update! : TournamentSettings;
  preview? : [string, string];
  winner? : string;

  constructor(){}

  ngOnInit(){
    const preview = this.manager.update.getNextMatchPreview();
    console.log('current', preview);
    console.log('allTeams', this.update.teamNames);
    if (typeof preview === 'string')
      this.winner = preview;
    else
      this.preview = preview;
  }

  getVs() : string{
    return `${this.preview![0]} vs ${this.preview![1]}`
  }
}
