self.addEventListener('fetch', (event) => {
  // This is a minimal fetch handler to meet Chrome's installability criteria.
  // It doesn't perform any caching, just passes the request through.
  event.respondWith(fetch(event.request));
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queued-activities') {
    event.waitUntil(syncQueuedActivities());
  }
});

async function syncQueuedActivities() {
  const { Dexie } = await import('dexie');

  const db = new Dexie('progressly');
  db.version(2).stores({
    queued_activities: '++id,activity_name,start_time,end_time,category_id',
    auth_token: 'id'
  });

  const authToken = await db.auth_token.get('fastapi-token');
  if (!authToken) {
    console.error('Auth token not found in IndexedDB. Cannot sync.');
    return;
  }

  const queuedActivities = await db.queued_activities.toArray();

  for (const activity of queuedActivities) {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/activities/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken.token}`,
        },
        body: JSON.stringify({
            activity_name: activity.activity_name,
            start_time: activity.start_time,
            end_time: activity.end_time,
            category_id: activity.category_id,
            activity_date: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        await db.queued_activities.delete(activity.id);
      } else {
        console.error('Failed to sync activity:', activity.id, await response.text());
      }
    } catch (error) {
      console.error('Error syncing activity:', activity.id, error);
    }
  }
}
