import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// this is going to be replaced by start.sh
export var ip = "localhost";
export var id42 = "cuarentaidos";

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(error => console.error(error));