import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SpaceshipComponent } from './spaceship/spaceship.component';

@NgModule({
  declarations: [
    AppComponent,
    SpaceshipComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
