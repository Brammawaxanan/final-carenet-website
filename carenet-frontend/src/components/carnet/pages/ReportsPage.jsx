import React, { useState } from 'react'
import { Download, FileText, Calendar, TrendingUp } from 'lucide-react'

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState({ start: '2025-09-01', end: '2025-09-30' })

  const reports = [
    { id: 1, name: 'User Activity Report', description: 'Detailed user engagement metrics', icon: TrendingUp, format: ['PDF', 'CSV'] },
    { id: 2, name: 'Caregiver Performance', description: 'Task completion and ratings', icon: FileText, format: ['PDF', 'CSV'] },
    { id: 3, name: 'Financial Summary', description: 'Revenue and payment analytics', icon: FileText, format: ['PDF', 'CSV', 'Excel'] },
    { id: 4, name: 'Assignment Analytics', description: 'Active and completed assignments', icon: FileText, format: ['PDF', 'CSV'] }
  ]

  const handleDownload = (reportName, format) => {
    alert(`Downloading ${reportName} as ${format}`)
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-pale-900 mb-2">Reports & Analytics</h1>
        <p className="text-pale-600">Generate and export detailed platform reports</p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-pale-900 mb-4">Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-pale-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-pale-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map(report => (
          <div key={report.id} className="card hover:shadow-lg transition-all">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <report.icon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-pale-900 mb-1">{report.name}</h3>
                <p className="text-sm text-pale-600">{report.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t border-pale-200">
              {report.format.map(format => (
                <button
                  key={format}
                  onClick={() => handleDownload(report.name, format)}
                  className="flex-1 px-3 py-2 bg-pale-50 hover:bg-primary-50 text-pale-700 hover:text-primary-700 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>{format}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReportsPage
