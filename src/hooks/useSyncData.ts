import { useState, useEffect } from 'react';

/**
 * Hook pour synchroniser les composants React en temps réel lors des mises à jour locales ou Firestore cloud.
 */
export function useSyncData(onSyncUpdate?: () => void): number {
  const [revision, setRevision] = useState<number>(0);

  useEffect(() => {
    const handleUpdate = () => {
      setRevision((prev) => prev + 1);
      if (onSyncUpdate) {
        try {
          onSyncUpdate();
        } catch (err) {
          console.error('Error in useSyncData callback:', err);
        }
      }
    };

    window.addEventListener('edunova_data_updated', handleUpdate);
    window.addEventListener('edunova_cloud_synced', handleUpdate);

    return () => {
      window.removeEventListener('edunova_data_updated', handleUpdate);
      window.removeEventListener('edunova_cloud_synced', handleUpdate);
    };
  }, [onSyncUpdate]);

  return revision;
}
