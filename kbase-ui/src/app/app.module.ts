import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { TestMod1Module } from './test-mod1/test-mod1.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    TestMod1Module
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
