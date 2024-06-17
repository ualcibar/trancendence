import { Component, Input,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_ASYNC_VALIDATORS } from '@angular/forms';
import { TournamentManager, TournamentSettings} from '../../services/gameManager.service';
import { State } from '../../utils/state';
import { Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { TournamentTree } from '../../utils/tournamentTree';

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
  @Input() tree! : TournamentTree;

  constructor(){}

  ngOnInit(){
    const preview = this.manager.update.getNextMatchPreview();
    console.log('current', preview);
    if (typeof preview === 'string')
      this.winner = preview;
    else
      this.preview = preview;
    this.tree = this.manager.update.getTournamentTree();
    console.log("my treee---->", this.tree);
  }

  getVs() : string{
    return `${this.preview![0]} vs ${this.preview![1]}`
  }
}
