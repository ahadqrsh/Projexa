import BaseRepository from './base.repository.js';
import { Notification } from '../models/notification.model.js';

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  unreadCount(userId) {
    return this.model.countDocuments({ user: userId, isRead: false });
  }

  markAllRead(userId) {
    return this.model.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
