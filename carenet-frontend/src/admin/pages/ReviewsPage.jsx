import React, { useEffect, useState } from 'react'
import ApiService from '../../services/api'

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [caregiverFilter, setCaregiverFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('none') // 'none' | 'asc' | 'desc'

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        setLoading(true)
        const data = await ApiService.getAdminDashboard()
        // fallback: if admin endpoint doesn't include allReviews, try /reviews
        if (data?.allReviews) setReviews(data.allReviews)
        else {
          const r = await ApiService.getReviews()
          setReviews(r || [])
        }
      } catch (err) {
        console.error('Failed to load reviews', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAdmin()
  }, [])

  if (loading) return <div>Loading reviews...</div>
  if (error) return <div className="text-red-600">Error loading reviews</div>

  const filtered = reviews.filter((r) => {
    const created = r.createdAt ? new Date(r.createdAt) : null
    if (fromDate && created && created < new Date(fromDate)) return false
    if (toDate && created && created > new Date(toDate + 'T23:59:59')) return false
    if (minRating && (r.rating || 0) < minRating) return false
    if (caregiverFilter) {
      const cid = (r.caregiverId || '').toString()
      const cname = (r.caregiverName || '').toLowerCase()
      if (cid !== caregiverFilter && cname !== caregiverFilter.toLowerCase()) return false
    }
    if (searchText) {
      const st = searchText.toLowerCase()
      const combined = `${r.userName||''} ${r.caregiverName||''} ${r.comment||''} ${r.userId||''} ${r.caregiverId||''}`.toLowerCase()
      if (!combined.includes(st)) return false
    }
    return true
  })

  // derive caregivers for filter dropdown
  const caregivers = Array.from(new Map(reviews.map(r => [r.caregiverId || r.caregiverName || `id-${r.caregiverId}`, {
    id: r.caregiverId || r.caregiverName || '',
    name: r.caregiverName || (`Caregiver ${r.caregiverId}`)
  }])).values())

  const resetFilters = () => {
    setFromDate('')
    setToDate('')
    setMinRating(0)
    setSearchText('')
    setCaregiverFilter('')
    setSortOrder('none')
  }

  const generateCsv = () => {
    if (!filtered || filtered.length === 0) {
      alert('No reviews to export for the selected criteria.')
      return
    }
    const rows = filtered.map(r => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName || '',
      caregiverId: r.caregiverId || '',
      caregiverName: r.caregiverName || '',
      rating: r.rating || '',
      comment: (r.comment || '').replace(/\n/g, ' '),
      createdAt: r.createdAt || ''
    }))
    const header = Object.keys(rows[0] || {})
    const csv = [header.join(','), ...rows.map(row => header.map(h => `"${(row[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reviews-report-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold mb-4">Client Reviews</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">From</label>
          <input type="date" className="border rounded px-2 py-1 w-40" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <label className="text-sm">To</label>
          <input type="date" className="border rounded px-2 py-1 w-40" value={toDate} onChange={e => setToDate(e.target.value)} />
          <label className="text-sm">Min Rating</label>
          <select className="border rounded px-2 py-1 w-28" value={minRating} onChange={e => setMinRating(Number(e.target.value))}>
            <option value={0}>Any</option>
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
            <option value={5}>5</option>
          </select>
          <label className="text-sm">Caregiver</label>
          <select className="border rounded px-2 py-1 w-48" value={caregiverFilter} onChange={e => setCaregiverFilter(e.target.value)}>
            <option value=''>All</option>
            {caregivers.map(c => (
              <option key={c.id || c.name} value={c.id || c.name}>{c.name || c.id}</option>
            ))}
          </select>
          <input type="search" placeholder="Search user/caregiver/comment" className="border rounded px-2 py-1 w-56" value={searchText} onChange={e => setSearchText(e.target.value)} />
          <button onClick={resetFilters} className="border px-2 py-1 rounded">Reset</button>
          <label className="text-sm">Sort</label>
          <select className="border rounded px-2 py-1 w-36" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="none">None</option>
            <option value="asc">Rating ↑</option>
            <option value="desc">Rating ↓</option>
          </select>
          <button onClick={generateCsv} className="bg-primary-600 text-white px-3 py-1 rounded">Generate CSV</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-600">No reviews match the selected criteria.</p>
      ) : (
        (() => {
          const sorted = [...filtered]
          if (sortOrder === 'asc') sorted.sort((a,b) => (a.rating||0) - (b.rating||0))
          else if (sortOrder === 'desc') sorted.sort((a,b) => (b.rating||0) - (a.rating||0))

          return (
            <div className="space-y-4">
              {sorted.map((rev) => (
                    <div key={rev.id} className="p-4 bg-white rounded shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{rev.userName || `User ${rev.userId}`}</div>
                      <div className="text-sm text-gray-500">Caregiver: {rev.caregiverName || rev.caregiverId || '—'}</div>
                    </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-yellow-500">{'★'.repeat(rev.rating || 0)}</div>
                          {ApiService.getUserRole() === 'ADMIN' && (
                            <div className="flex items-center space-x-2">
                              <button onClick={async () => {
                                const newComment = prompt('Edit comment', rev.comment || '')
                                const newRating = Number(prompt('Edit rating (1-5)', rev.rating || 5))
                                if (newComment != null && !Number.isNaN(newRating)) {
                                  try {
                                    await ApiService.updateReview(rev.id, { rating: newRating, comment: newComment, userId: rev.userId })
                                    // refresh list
                                    const data = await ApiService.getAdminDashboard()
                                    if (data?.allReviews) setReviews(data.allReviews)
                                  } catch (err) { alert('Failed to update review: ' + err.message) }
                                }
                              }} className="text-sm text-blue-600">Edit</button>
                              <button onClick={async () => {
                                if (!confirm('Delete this review?')) return
                                try {
                                  await ApiService.deleteReview(rev.id)
                                  const data = await ApiService.getAdminDashboard()
                                  if (data?.allReviews) setReviews(data.allReviews)
                                } catch (err) { alert('Failed to delete review: ' + err.message) }
                              }} className="text-sm text-red-600">Delete</button>
                            </div>
                          )}
                        </div>
                  </div>
                  <div className="mt-2 text-gray-700">{rev.comment}</div>
                  <div className="text-xs text-gray-400 mt-2">{rev.createdAt}</div>
                </div>
              ))}
            </div>
          )
        })()
      )}
    </div>
  )
}

export default ReviewsPage
