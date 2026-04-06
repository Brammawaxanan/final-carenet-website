import React from 'react'
import { DollarSign, CreditCard, TrendingUp, Calendar, ExternalLink } from 'lucide-react'

const PaymentHistory = ({ ledger, runningDue }) => {
  const formatAmount = (cents) => {
    return `$${(Math.abs(cents) / 100).toFixed(2)}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getEntryIcon = (type) => {
    switch (type) {
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-green-600" />
      case 'ACCRUAL':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      case 'ADJUSTMENT':
        return <Calendar className="w-4 h-4 text-amber-600" />
      default:
        return <DollarSign className="w-4 h-4 text-pale-600" />
    }
  }

  const getEntryColor = (type) => {
    switch (type) {
      case 'PAYMENT':
        return 'text-green-700'
      case 'ACCRUAL':
        return 'text-blue-700'
      case 'ADJUSTMENT':
        return 'text-amber-700'
      default:
        return 'text-pale-700'
    }
  }

  const totalAccrued = ledger
    ?.filter(entry => entry.entryType === 'ACCRUAL' || entry.entryType === 'ADJUSTMENT')
    .reduce((sum, entry) => sum + (entry.amountCents || 0), 0) || 0

  const totalPaid = ledger
    ?.filter(entry => entry.entryType === 'PAYMENT')
    .reduce((sum, entry) => sum + (entry.amountCents || 0), 0) || 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-pale-900">Payment Summary</h3>
        <DollarSign className="w-5 h-5 text-primary-600" />
      </div>

      {/* Summary Cards */}
      <div className="space-y-3 mb-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Earned</p>
              <p className="text-blue-900 text-xl font-bold">{formatAmount(totalAccrued)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Paid</p>
              <p className="text-green-900 text-xl font-bold">{formatAmount(totalPaid)}</p>
            </div>
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className={`p-4 border rounded-lg ${
          runningDue > 0 
            ? 'bg-red-50 border-red-200' 
            : 'bg-pale-50 border-pale-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                runningDue > 0 ? 'text-red-600' : 'text-pale-600'
              }`}>
                Amount Due
              </p>
              <p className={`text-xl font-bold ${
                runningDue > 0 ? 'text-red-900' : 'text-pale-900'
              }`}>
                {formatAmount(runningDue)}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${
              runningDue > 0 ? 'text-red-600' : 'text-pale-600'
            }`} />
          </div>
        </div>
      </div>

      {/* Pay Now Button */}
      {runningDue > 0 && (
        <button className="w-full btn-primary mb-6 flex items-center justify-center space-x-2">
          <CreditCard className="w-4 h-4" />
          <span>Pay Now - {formatAmount(runningDue)}</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      )}

      {/* Transaction History */}
      <div>
        <h4 className="font-medium text-pale-900 mb-4">Recent Transactions</h4>
        
        {ledger && ledger.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {ledger.slice().reverse().map((entry, index) => (
              <div key={entry.id || index} className="flex items-center justify-between p-3 bg-pale-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getEntryIcon(entry.entryType)}
                  <div>
                    <p className={`font-medium text-sm ${getEntryColor(entry.entryType)}`}>
                      {entry.entryType.charAt(0) + entry.entryType.slice(1).toLowerCase()}
                    </p>
                    <p className="text-pale-600 text-xs">
                      {formatDate(entry.createdAt)}
                    </p>
                    {entry.note && (
                      <p className="text-pale-500 text-xs mt-1">{entry.note}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold ${
                    entry.entryType === 'PAYMENT' ? 'text-green-700' : 'text-blue-700'
                  }`}>
                    {entry.entryType === 'PAYMENT' ? '-' : '+'}{formatAmount(entry.amountCents || 0)}
                  </p>
                  {entry.externalRef && (
                    <p className="text-pale-500 text-xs">#{entry.externalRef}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-pale-500">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No transactions yet</p>
          </div>
        )}
      </div>

      {/* View All Link */}
      {ledger && ledger.length > 5 && (
        <div className="mt-4 pt-4 border-t border-pale-200">
          <button className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center space-x-1">
            <span>View All Transactions</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export default PaymentHistory
