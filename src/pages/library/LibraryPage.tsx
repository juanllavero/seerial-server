import { memo } from 'react'
import { useParams } from 'react-router-dom'
import LibraryPageContent from './components/LibraryPageContent'

function LibraryPage() {
  const { libraryId, type } = useParams()

  return <LibraryPageContent libraryId={libraryId ?? ''} type={type ?? ''} />
}

export default memo(LibraryPage)
