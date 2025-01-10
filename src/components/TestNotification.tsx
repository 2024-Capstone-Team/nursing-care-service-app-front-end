import React from 'react';

const TestNotification: React.FC = () => {
  const handleNotification = () => {
    console.log('Notification handler triggered.');
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification('Hello!', {
              body: 'This is a test notification.',
              icon: '/icons/icon-192x192.png',
            });
            console.log('Notification sent.');
          });
        } else {
          console.warn('Notification permission denied.');
        }
      });
    } else {
      alert('Notifications are not supported in this browser.');
    }
  };

  return (
    <button
      onClick={handleNotification}
      className="bg-blue-600 text-white py-2 px-4 rounded"
    >
      Show Notification
    </button>
  );
};

export default TestNotification;