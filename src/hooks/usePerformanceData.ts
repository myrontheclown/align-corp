import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, orderBy, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Goal, Review } from '../types';

export function usePerformanceData() {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reportsGoals, setReportsGoals] = useState<Goal[]>([]);
  const [reportsReviews, setReportsReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    // Fetch user's own goals
    const goalsQuery = query(
      collection(db, 'goals'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeGoals = onSnapshot(goalsQuery, 
      (snapshot) => {
        setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'goals')
    );

    // Fetch user's own reviews
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('userId', '==', profile.uid),
      orderBy('year', 'desc'),
      orderBy('quarter', 'desc')
    );

    const unsubscribeReviews = onSnapshot(reviewsQuery,
      (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'reviews')
    );

    // If manager, fetch reports' data
    let unsubscribeReportsGoals = () => {};
    let unsubscribeReportsReviews = () => {};

    if (profile.role === 'manager' || profile.role === 'admin') {
      const reportsGoalsQuery = query(
        collection(db, 'goals'),
        where('managerId', '==', profile.uid),
        orderBy('createdAt', 'desc')
      );

      unsubscribeReportsGoals = onSnapshot(reportsGoalsQuery,
        (snapshot) => {
          setReportsGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'goals (manager view)')
      );

      const reportsReviewsQuery = query(
        collection(db, 'reviews'),
        where('managerId', '==', profile.uid),
        orderBy('createdAt', 'desc')
      );

      unsubscribeReportsReviews = onSnapshot(reportsReviewsQuery,
        (snapshot) => {
          setReportsReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'reviews (manager view)')
      );
    }

    setLoading(false);

    return () => {
      unsubscribeGoals();
      unsubscribeReviews();
      unsubscribeReportsGoals();
      unsubscribeReportsReviews();
    };
  }, [profile]);

  return { goals, reviews, reportsGoals, reportsReviews, loading };
}
