
import { bus } from './eventBus';
import { Notification } from '../types';

const uuid = () => Math.random().toString(36).substr(2, 9);

class NotificationService {
    public send(title: string, message: string, type: Notification['type'] = 'info') {
        const notification: Notification = {
            id: uuid(),
            title,
            message,
            type,
            timestamp: Date.now()
        };
        bus.emit('notification', notification);
    }

    public success(title: string, message: string) { this.send(title, message, 'success'); }
    public error(title: string, message: string) { this.send(title, message, 'error'); }
    public info(title: string, message: string) { this.send(title, message, 'info'); }
    public warning(title: string, message: string) { this.send(title, message, 'warning'); }
}

export const notify = new NotificationService();
