import { useEffect, useState } from 'react'
import socketService from '../services/socket'
import { useWorkerStore } from '../store/workerStore'
import toast from 'react-hot-toast'

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const { fetchWorkers } = useWorkerStore()

  useEffect(() => {
    socketService.connect()
    setIsConnected(socketService.isConnected())

    const handleConnect = () => {
      setIsConnected(true)
      toast.success('Connected to server')
      fetchWorkers()
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      toast.error('Disconnected from server')
    }

    const handleTaskCompleted = (data) => {
      toast.success(`Task ${data.taskId} completed by worker ${data.workerId}`)
      fetchWorkers()
    }

    const handleUpdateBrain = () => {
      fetchWorkers()
    }

    socketService.on('connect', handleConnect)
    socketService.on('disconnect', handleDisconnect)
    socketService.on('task-completed-alert', handleTaskCompleted)
    socketService.on('update-brain', handleUpdateBrain)

    return () => {
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
      socketService.off('task-completed-alert', handleTaskCompleted)
      socketService.off('update-brain', handleUpdateBrain)
    }
  }, [fetchWorkers])

  const sendTask = (workerId, url, prompt) => {
    if (!isConnected) {
      toast.error('Not connected to server')
      return false
    }
    socketService.emit('send-task-to-worker', { workerId, url, prompt })
    return true
  }

  return { isConnected, sendTask }
}