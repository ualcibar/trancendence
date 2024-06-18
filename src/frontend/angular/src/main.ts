import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// this is going to be replaced by start.sh
var ip = "10.13.7.2/16";

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(error => console.error(error));