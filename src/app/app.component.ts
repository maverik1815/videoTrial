import { Router } from '@angular/router';
import { Component, Inject, OnInit } from '@angular/core';
import {
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
  MsalService,
  MsalBroadcastService,
} from '@azure/msal-angular';
import {
  AuthenticationResult,
  EndSessionRequest,
  EventMessage,
  EventType,
  InteractionStatus,
} from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { b2cPolicies } from './b2c-config';
import jwt_decode from 'jwt-decode';
import { DEFAULT_INTERRUPTSOURCES, Idle } from '@ng-idle/core';
import { Keepalive } from '@ng-idle/keepalive';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AlertDialogComponent } from './components/alert-dialog/alert-dialog.component';

interface IdTokenClaims extends AuthenticationResult {
  idTokenClaims: {
    acr?: string;
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  opened = false;

  private readonly _destroying$ = new Subject<void>();
  isIframe = false;
  username = '';
  userRole = '';
  idleState: string;
  lastPing: Date;
  timedOut = false;
  isUploading = false;
  dialogRef:  MatDialogRef<AlertDialogComponent>;;

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private idle: Idle,
    private keepalive: Keepalive,
    private router: Router,
    private dialog: MatDialog
  ) {
    // this.authService.handleRedirectObservable().subscribe((res) => {
    //   console.log(res);
    // });
    // sets an idle timeout of 5 seconds, for testing purposes.
    // idle.setIdle(5);
    // // sets a timeout period of 5 seconds. after 10 seconds of inactivity, the user will be considered timed out.
    // idle.setTimeout(5);
    // // sets the default interrupts, in this case, things like clicks, scrolls, touches to the document
    // idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);
    // idle.onIdleEnd.subscribe(() => (this.idleState = 'No longer idle.'));
    // idle.onTimeout.subscribe(() => {
    //   this.idleState = 'Timed out!';
    //   //  this.timedOut = true;
    //   this.logout();
    // });
    // idle.onIdleStart.subscribe(() => (this.idleState = 'You\'ve gone idle!'));
    // idle.onTimeoutWarning.subscribe(
    //   (countdown: string) =>
    //     (this.idleState = 'You will time out in ' + countdown + ' seconds!')
    // );
    // // sets the ping interval to 15 seconds
    // keepalive.interval(15);
    // keepalive.onPing.subscribe(() => (this.lastPing = new Date()));
    // this.reset();
  }

  // reset(): void {
  //   this.idle.watch();
  //   this.idleState = 'Started.';
  // }

  ngOnInit(): void {
    localStorage.clear();
    this.isIframe = window !== window.parent && !window.opener;
    this.startSessionIdle();
    if (sessionStorage.getItem('token')){
      this.reset();
    } else {
      this.idle.stop();
    }
    this.msalBroadcastService.inProgress$
      .pipe(
        filter(
          (status: InteractionStatus) => status === InteractionStatus.None
        ),
        takeUntil(this._destroying$)
      )
      // tslint:disable-next-line: deprecation
      .subscribe((res) => {
        console.log(res);
      });

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.LOGIN_SUCCESS ||
            msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
        ),
        takeUntil(this._destroying$)
      )
      // tslint:disable-next-line: deprecation
      .subscribe((result: EventMessage) => {
        const payload: IdTokenClaims = result.payload as AuthenticationResult;
        console.log(result);
        sessionStorage.setItem('token', payload.idToken);
        const getApproval: any = jwt_decode(payload.idToken);
        if (getApproval.extension_accountstatus !== 'Active') {
          if (getApproval.extension_accountstatus === 'superuser') {
            this.router.navigate(['admin-user']);
          } else {
            this.router.navigate(['not-authorized']);
          }
        } else {
          this.router.navigate(['/']);
        }

        return result;
      });
  }
  ngDoCheck(){
   
    if(this.isUploading && this.idle.isRunning()){
      this.idle.stop();
    } else if (!this.isUploading && !this.idle.isRunning() && sessionStorage.getItem('token')) {
     
      this.reset();
    }
  }

  startSessionIdle() {
    this.idle.setIdle(6000);
    // sets a timeout period of 5 seconds. after 10 seconds of inactivity, the user will be considered timed out.
    this.idle.setTimeout(10);
    // sets the default interrupts, in this case, things like clicks, scrolls, touches to the document
    this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    this.idle.onIdleEnd.subscribe(() =>{
      this.dialogRef.componentInstance.onConfirmClick();
    });
    this.idle.onTimeout.subscribe(() => {
      this.idleState = '';
      this.idleState = 'Session timeout .Kindly login again.';
      this.timedOut = true;
      if (sessionStorage.getItem('token')){
        this.logout();
      }
      
    });
    this.idle.onIdleStart.subscribe(() => { this.idleState = '' });
    this.idle.onTimeoutWarning.subscribe((countdown: any) => {
      this.idleState = 'Your session will end in ' + countdown + ' seconds!';
      if (this.dialogRef && this.dialogRef.componentInstance) {
        this.dialogRef.componentInstance.updateMessage({message: this.idleState});
      }
     
      if (this.dialog.openDialogs.length == 0) {
        this.openAlertDialog();
      }
    }
      
      );

    // sets the ping interval to 15 seconds
    this.keepalive.interval(15);

    this.keepalive.onPing.subscribe(() => this.lastPing = new Date());

    this.reset();
  }
  reset() {
    this.idle.watch();
    this.idleState = '';
    this.timedOut = false;
  }
  openAlertDialog() {
    this.dialogRef = this.dialog.open(AlertDialogComponent,{
      data:{
        message:  this.idleState,
        buttonText: {
          cancel: 'Ok'
        }
      },
    });
  }

  logout(): void {
    this.idle.stop();
    const endSessionRequest: EndSessionRequest = {
      authority: b2cPolicies.authorities.signUpSignIn.authority,
    };
    sessionStorage.clear();
    // tslint:disable-next-line: deprecation
    this.authService.logout(endSessionRequest).subscribe((res) => {
      console.log('logout success');
    });
  }

  getUserName(): string {
    try {
      const token: any = jwt_decode(sessionStorage.getItem('token'));
      return token.given_name + ' ' + token.family_name;
    } catch (e) {
      return '';
    }
  }

  getUserRole(): string {
    try {
      const token: any = jwt_decode(sessionStorage.getItem('token'));
      const roleData = JSON.parse(token.extension_selectedrole);
      const userRoles = [];
      for (const iterator of Object.keys(roleData)) {
        for (const iter of roleData[iterator]) {
          userRoles.push(iter.role);
        }
      }
      if (userRoles.find((e) => e === 'Admin')) {
        this.userRole = 'admin';
        return this.userRole;
      } else if (userRoles.find((e) => e === 'Uploader')) {
        this.userRole = 'uploader';
        return this.userRole;
      } else {
        this.userRole = 'viewer';
        return 'viewer';
      }
    } catch (e) {
      return '';
    }
  }

  canUplaodVideo(): boolean {
    if (
      this.userRole.toLowerCase() === 'admin' ||
      this.userRole.toLowerCase() === 'uploader'
    ) {
      return true;
    }
    return false;
  }

  canAddProcedure(): boolean {
    if (
      this.userRole.toLowerCase() === 'admin' ||
      this.userRole.toLowerCase() === 'viewer'
    ) {
      return true;
    }
    return false;
  }

  idSuperAdmin(): boolean {
    const token: any = jwt_decode(sessionStorage.getItem('token'));
    if (token.extension_accountstatus === 'superuser') {
      return true;
    }
    else {
      return false;
    }
  }
}
