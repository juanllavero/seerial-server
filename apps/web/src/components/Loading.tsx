import '@/styles/components/Loading.css'
import SmallSpinner from './SideBar/loading/SmallSpinner'

function Loading() {
  return (
    <div className="loading-content">
      <SmallSpinner size={40} />
    </div>
  )
}

export default Loading
