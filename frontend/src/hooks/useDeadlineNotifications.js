import { useEffect } from 'react';

export function useDeadlineNotifications(companies) {
  useEffect(() => {
    if (!companies?.length || !('Notification' in window)) return;

    const run = async () => {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') return;

      const now = new Date();
      companies.forEach((c) => {
        if (!c.deadline || c.status === 'accepted' || c.status === 'rejected') return;
        const daysLeft = Math.ceil((new Date(c.deadline) - now) / 86400000);
        if (daysLeft < 0 || daysLeft > 3) return;

        const key = `notified-${c.id}-${c.deadline}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');

        const msg =
          daysLeft === 0 ? `Deadline TODAY for ${c.name}!` :
          daysLeft === 1 ? `Deadline TOMORROW for ${c.name}` :
          `${daysLeft} days left for ${c.name}`;

        new Notification('OJT Buddy — Deadline Reminder', {
          body: msg,
          icon: '/favicon.svg',
        });
      });
    };

    run();
  }, [companies]);
}
