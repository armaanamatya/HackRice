import { useState } from 'react'
import UserList from './components/UserList'
import './App.css'

function App() {
  const [testResult, setTestResult] = useState(null)

  const testAPI = async () => {
    try {
      const response = await fetch('/api/test')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      console.error('API test failed:', error)
    }
  }

  return (
    <>
      <h1>React + Vite + Node.js + MongoDB</h1>
      <div className="card">
        <button onClick={testAPI}>Test API Connection</button>
        {testResult && (
          <div>
            <p>API Response: {testResult.message}</p>
            <p>Timestamp: {new Date(testResult.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
      <UserList />
    </>
  )
}

export default App
