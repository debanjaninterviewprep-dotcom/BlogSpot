import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Notification } from '../models/notification.model';

// SignalR will be loaded dynamically
declare const signalR: any;

@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  private hubConnection: any = null;
  private destroy$ = new Subject<void>();
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification$ = this.notificationSubject.asObservable();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  async startConnection(): Promise<void> {
    const token = this.authService.getToken();
    if (!token) return;

    try {
      // Use dynamic import for SignalR
      const signalRModule = await import('@microsoft/signalr');

      this.hubConnection = new signalRModule.HubConnectionBuilder()
        .withUrl(`${environment.apiUrl.replace('/api', '')}/hubs/notifications`, {
          accessTokenFactory: () => this.authService.getToken() || ''
        })
        .withAutomaticReconnect()
        .build();

      this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
        this.notificationSubject.next(notification);
        this.notificationService.incrementUnreadCount();
      });

      await this.hubConnection.start();
      console.log('SignalR connected');
    } catch (err) {
      console.warn('SignalR connection failed, real-time notifications unavailable:', err);
    }
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopConnection();
  }
}
