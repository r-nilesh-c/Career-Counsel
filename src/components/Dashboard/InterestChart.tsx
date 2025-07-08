import React from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface InterestData {
  category: string
  score: number
  fullMark: 5
}

interface SkillMatchData {
  skill: string
  match: number
}

interface InterestChartProps {
  interestData: InterestData[]
  skillMatchData: SkillMatchData[]
}

export function InterestChart({ interestData, skillMatchData }: InterestChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Interest Profile</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interest Radar Chart */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-4">Interest Areas</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={interestData}>
                <PolarGrid />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 5]} 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                />
                <Radar
                  name="Interest Level"
                  dataKey="score"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Match Bar Chart */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-4">Skill Match</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillMatchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="skill" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  domain={[0, 100]}
                />
                <Tooltip />
                <Bar 
                  dataKey="match" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Interest Level (1-5 scale)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Skill Match (%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}