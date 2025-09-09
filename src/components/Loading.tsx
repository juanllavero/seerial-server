import '@/styles/components/Loading.css'
import SmallSpinner from './SideBar/loading/SmallSpinner'

function Loading() {
  return (
    <div className="loading-content">
      {/* <div className="loading-circle"></div> */}
      <SmallSpinner size={40} />
    </div>
  )
}

export default Loading
