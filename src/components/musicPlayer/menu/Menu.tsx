import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import { useState } from 'react'
import './Menu.css'
import NextSongs from './NextSongs'

function Menu() {
  const isMobile = useIsMobile()
  const [section, setSection] = useState<number>(isMobile ? 0 : 1)

  return (
    <FlexBox
      direction="column"
      className="menu"
      width={'100%'}
      height={'100%'}
      gap={1}
    >
      <FlexBox width={'100%'}>
        <div
          className={`section ${section === 1 ? 'active' : ''}`}
          onClick={() => setSection(1)}
        >
          <span>Siguiente</span>
        </div>
        <div
          className={`section ${section === 2 ? 'active' : ''}`}
          onClick={() => setSection(2)}
        >
          <span>Letras</span>
        </div>
      </FlexBox>
      {!isMobile && (
        <FlexBox width={'100%'} padding="1rem">
          {section === 1 ? <NextSongs /> : <span>Letras</span>}
        </FlexBox>
      )}
    </FlexBox>
  )
}

export default Menu
