// Firebase has been removed - using MongoDB backend API instead
// This hook is kept for backward compatibility but returns empty data

import { useState, useEffect } from 'react';

export function useCollection(collectionName: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No longer using Firebase - data should come from backend API
    console.warn(`useCollection hook called for ${collectionName} but Firebase has been removed. Use backend API instead.`);
    setLoading(false);
    setError('Firebase has been removed - please use backend API');
  }, [collectionName]);

  return { data, loading, error };
}

export function useDocument(collectionName: string, documentId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.warn(`useDocument hook called for ${collectionName}/${documentId} but Firebase has been removed. Use backend API instead.`);
    setLoading(false);
    setError('Firebase has been removed - please use backend API');
  }, [collectionName, documentId]);

  return { data, loading, error };
}
