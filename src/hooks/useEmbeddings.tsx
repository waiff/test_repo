import { useEffect, useRef, useState } from 'react';

import { useAuthentication } from '../contexts/AuthenticationContext';
import { DocumentService } from '../services/DocumentService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';

export function useEmbeddings() {
  const embeddingsCalculatedFlagRef = useRef(null);
  const { isAuthenticated } = useAuthentication();
  const { calculateEmbeddings } = useRallyApi();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const calculateEmbeddingsOnLoad = async () => {
      if (!isAuthenticated || !!embeddingsCalculatedFlagRef.current) {
        return null;
      }

      // @ts-ignore FIX-ME
      embeddingsCalculatedFlagRef.current = true;
      return Word.run(async (context) => {
        const document = await DocumentService.getDocumentText(context);
        try {
          console.log('calculating embeddings');
          await calculateEmbeddings(document);
          console.log('calculated embeddings');
        } catch (error) {
          handleException(error);
        } finally {
          setDone(true);
        }
      });
    };
    calculateEmbeddingsOnLoad();
  }, [isAuthenticated, calculateEmbeddings]);

  return { done };
}
