import React from 'react'
import { TrendingUp, Target, CheckCircle } from 'lucide-react'

const ProgressChart = ({ total, completed, progress }) => {
  const circumference = 2 * Math.PI * 45   // radius = 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-pale-900">Progress Overview</h3>
        <TrendingUp className="w-5 h-5 text-primary-600" />
      </div>

      {/* Circular Progress Chart */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-pale-200"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-primary-600 transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-pale-900">{progress}%</div>
              <div className="text-xs text-pale-600">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-pale-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-pale-600" />
            <span className="text-pale-700 font-medium">Total Tasks</span>
          </div>
          <span className="font-semibold text-pale-900">{total}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-medium">Completed</span>
          </div>
          <span className="font-semibold text-green-900">{completed}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-600 rounded-full"></div>
            <span className="text-primary-700 font-medium">Remaining</span>
          </div>
          <span className="font-semibold text-primary-900">{total - completed}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-pale-600 mb-2">
          <span>Progress</span>
          <span>{completed} of {total} tasks</span>
        </div>
        <div className="w-full bg-pale-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
        <p className="text-primary-700 text-sm text-center font-medium">
          {progress === 100 ? '🎉 All tasks completed! Great work!' :
           progress >= 75 ? '🚀 Almost there! Keep it up!' :
           progress >= 50 ? '💪 Great progress! You\'re halfway there!' :
           progress >= 25 ? '📈 Good start! Keep going!' :
           '🎯 Let\'s get started on those tasks!'}
        </p>
      </div>
    </div>
  )
}

export default ProgressChart
