import React, { useState } from 'react';
import ApiService from '../services/api';

export default function ReviewItem({ review, currentUserId, onUpdated, onDeleted }) {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(review.rating || 0);
  const [comment, setComment] = useState(review.comment || '');
  const api = ApiService;

  const isOwner = currentUserId && review.userId && Number(currentUserId) === Number(review.userId);

  const saveEdit = async () => {
    const data = { rating, comment };
    try {
      const res = await api.updateReview(review.id, data);
      if (res) {
        setIsEditing(false);
        onUpdated && onUpdated(res);
      }
    } catch (err) {
      console.error('Failed to update review', err);
      alert('Failed to update review');
    }
  };

  const confirmDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.deleteReview(review.id);
      onDeleted && onDeleted(review.id);
    } catch (err) {
      console.error('Failed to delete review', err);
      alert('Failed to delete review');
    }
  };

  return (
    <article className="review-item p-4 bg-white border border-gray-100 rounded-lg shadow-sm mb-4">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold text-lg">
            { (review.userName || '').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U' }
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <strong className="text-sm text-pale-900">{review.userName || review.userId || 'User'}</strong>
                <div className="text-xs text-gray-400">{new Date(review.createdAt || review.createdDate || Date.now()).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isOwner && (
                <>
                  {!isEditing && <button className="text-sm text-blue-600 hover:underline" onClick={() => setIsEditing(true)}>Edit</button>}
                  {!isEditing && <button className="text-sm text-red-600 hover:underline" onClick={confirmDelete}>Delete</button>}
                </>
              )}
            </div>
          </div>

          {!isEditing ? (
            <div className="mt-3">
              <div className="text-yellow-500 text-xl tracking-wider">{'★'.repeat(Math.max(0, Math.round(review.rating || 0)))}{'☆'.repeat(5 - Math.max(0, Math.round(review.rating || 0)))}</div>
              <p className="mt-2 text-sm text-pale-700 whitespace-pre-line">{review.comment}</p>
            </div>
          ) : (
            <form className="mt-3 space-y-3" onSubmit={e => { e.preventDefault(); saveEdit(); }}>
              <div>
                <label className="block text-sm font-medium text-pale-800 mb-1">Rating</label>
                <div className="flex items-center space-x-1">
                  {[1,2,3,4,5].map(i => (
                    <button key={i} type="button" aria-label={`Set rating ${i}`} onClick={() => setRating(i)} className={`text-2xl ${i <= rating ? 'text-yellow-500' : 'text-gray-300'} focus:outline-none`}>
                      {i <= rating ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-pale-800 mb-1">Comment</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full px-3 py-2 border rounded-md resize-none" rows={3} />
              </div>

              <div className="flex items-center space-x-2">
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md">Save</button>
                <button type="button" className="px-4 py-2 bg-gray-100 rounded-md" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}
