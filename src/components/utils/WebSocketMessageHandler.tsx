import { useEffect } from 'react';
import { useWebSocketStore } from '@/context/ws.context';
import useDataStore from '@/context/data.context';
import { MessageType } from '@/data/enums/WSMessage';

const WebSocketMessageHandler: React.FC = () => {
  const { messageQueue, clearMessageQueue } = useWebSocketStore();
  const { 
    addLibrary, 
    updateLibrary, 
    addSeries, 
    updateSeries, 
    addSeason, 
    addEpisode 
  } = useDataStore();

  useEffect(() => {
    if (messageQueue.length > 0) {
      messageQueue.forEach((message) => {
        switch (message.header) {
          case MessageType.ADD_LIBRARY:
            addLibrary(message.body.library);
            break;
          case MessageType.UPDATE_LIBRARY:
            updateLibrary(message.body.library);
            break;
          case MessageType.ADD_SERIES:
            addSeries(message.body);
            break;
          case MessageType.UPDATE_SERIES:
            updateSeries(message.body);
            break;
          case MessageType.ADD_SEASON:
            addSeason(message.body);
            break;
          case MessageType.ADD_EPISODE:
            addEpisode(message.body);
            break;
          // Download-related messages are handled directly in the store
          case MessageType.DOWNLOAD_PROGRESS:
          case MessageType.DOWNLOAD_ERROR:
          case MessageType.DOWNLOAD_COMPLETE:
            break;
          default:
            console.log(`Unhandled message type: ${message.header}`);
        }
      });
      
      // Clear processed messages
      clearMessageQueue();
    }
  }, [messageQueue, addLibrary, updateLibrary, addSeries, updateSeries, addSeason, addEpisode, clearMessageQueue]);

  // This component doesn't render anything
  return null;
};

export default WebSocketMessageHandler;