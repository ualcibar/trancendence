import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// this is going to be replaced by start.sh
export var ip = "127.0.0.1";

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(error => console.error(error));