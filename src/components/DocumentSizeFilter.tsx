import React, { useEffect, useRef, useState } from 'react';
import { handleException } from '../utils/ErrorUtils';
import { DocumentService } from '../services/DocumentService';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { Spinner, SpinnerSize } from './Spinner';

const MAX_WORD_COUNT = 200_000;

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex h-full flex-col items-center p-2">{children}</div>
  );
}

function DocumentTooLarge() {
  return (
    <Container>
      <p className="pb-2">
        Sorry, Spellbook can&apos;t analyze this document as it exceeds the
        maximum text size of {new Intl.NumberFormat().format(MAX_WORD_COUNT)}{' '}
        words.
      </p>
      <p>
        Please select a smaller file while we work on supporting larger
        documents.
      </p>
    </Container>
  );
}

type ErrorAnalyzingScreenProps = {
  getDocumentSize: () => Promise<void>;
};

function ErrorAnalyzingScreen({ getDocumentSize }: ErrorAnalyzingScreenProps) {
  return (
    <Container>
      <div className="pb-5">
        Sorry, something went wrong analyzing the document.
      </div>
      <button
        className="rounded bg-purple-1 px-4 py-2 font-bold text-white focus:outline-none"
        type="button"
        onClick={() => getDocumentSize()}
      >
        Retry
      </button>
    </Container>
  );
}

type DocumentSizeFilterProps = {
  children: React.ReactNode;
};

export function DocumentSizeFilter({ children }: DocumentSizeFilterProps) {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  const [wordCount, setWordCount] = useState<number | undefined>(undefined);

  const eventTracked = useRef<boolean>(false);

  const { trackEvent } = useAnalytics();

  const getDocumentSize = async () => {
    setIsAnalyzing(true);
    try {
      await Word.run(async (context) => {
        const documentText = await DocumentService.getDocumentText(context);

        setWordCount(documentText.split(/\s+/).length);
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    getDocumentSize().catch((error) => {
      handleException(error);
    });
  }, []);

  if (isAnalyzing) {
    return (
      <div className="mt-8">
        <Spinner size={SpinnerSize.large} label="Analyzing Document..." />
      </div>
    );
  }

  if (wordCount == null) {
    return <ErrorAnalyzingScreen getDocumentSize={() => getDocumentSize()} />;
  }

  if (wordCount && wordCount > MAX_WORD_COUNT) {
    if (!eventTracked.current) {
      trackEvent('Document too large', { wordCount });
      eventTracked.current = true;
    }
    return <DocumentTooLarge />;
  }

  return <>{children}</>;
}
