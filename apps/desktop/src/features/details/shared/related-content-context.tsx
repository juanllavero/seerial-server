import { createContext, useContext } from 'react';

interface RelatedContentContextValue {
  navigateToRelated: () => void;
  hasRelatedContent: boolean;
}

const RelatedContentContext = createContext<RelatedContentContextValue>({
  navigateToRelated: () => {},
  hasRelatedContent: false,
});

export function useRelatedContent() {
  return useContext(RelatedContentContext);
}

export default RelatedContentContext;
