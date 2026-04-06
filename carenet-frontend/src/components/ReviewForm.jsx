import React, { useState } from 'react'

const ReviewForm = ({ assignmentId, onSubmit }) => {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!rating || rating < 1 || rating > 5) return setError('Please choose a rating 1-5')
    setLoading(true)
    setError('')
    try {
      await onSubmit(rating, comment, () => {
        setLoading(false)
        setComment('')
      }, (err) => {
        setLoading(false)
        setError(err.message || 'Failed to submit review')
      })
    } catch (err) {
      setLoading(false)
      setError(err.message || 'Failed to submit review')
    }
  }

  const Star = ({ filled, size = '2xl' }) => (
    <span className={`text-${size} ${filled ? 'text-yellow-500' : 'text-gray-300'}`} aria-hidden>{filled ? '★' : '☆'}</span>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2" role="radiogroup" aria-label="Rating">
        {[1,2,3,4,5].map(i => (
          <button key={i} type="button" onClick={() => setRating(i)} aria-checked={i===rating} role="radio" className="p-1 focus:outline-none hover:scale-110 transition-transform">
            <Star filled={i <= rating} size="3xl" />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a short review (optional)" className="w-full px-3 py-2 border rounded-md resize-none" rows={4} />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex items-center justify-end">
        <button disabled={loading} onClick={submit} className="px-4 py-2 bg-primary-600 text-white rounded-md">
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}

export default ReviewForm
