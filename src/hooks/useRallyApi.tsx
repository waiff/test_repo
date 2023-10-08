import { useCallback } from 'react';

import { SpellSource } from '../common/SpellSource';
import { useAuthentication } from '../contexts/AuthenticationContext';
import {
  ClauseSearchFilter,
  ClauseSearchSort,
  DocStoreType,
  MissingClause,
  RallyApiService,
  ReviewStreamResult,
  RevisionType,
  SimilarityQuery,
  SpellDocumentData,
  TermSummary,
} from '../services/RallyApiService';
import { ChatMessage } from '../types/ChatMessage';
import { Party } from '../types/Party';
import { ReviewLens } from '../types/ReviewLens';

export function useRallyApi() {
  const { getToken } = useAuthentication();

  const getStatus = useCallback(
    async () => RallyApiService.getInstance().status(),
    [],
  );

  const fetchInvitationCount = useCallback(async () => {
    const token = await getToken();
    return RallyApiService.getInstance().fetchInvitationCount(token);
  }, [getToken]);

  const deprecateInvitationCount = useCallback(async () => {
    const token = await getToken();
    return RallyApiService.getInstance().deprecateInvitationCount(token);
  }, [getToken]);

  const submitInvitation = useCallback(
    async (email, name, isSameOrganization, inviterEmail, inviterName) => {
      const token = await getToken();
      return RallyApiService.getInstance().submitInvitation(
        token,
        email,
        name,
        isSameOrganization,
        inviterEmail,
        inviterName,
      );
    },
    [getToken],
  );

  const identify = useCallback(async () => {
    const token = await getToken();
    return RallyApiService.getInstance().identify(token);
  }, [getToken]);

  const activate = useCallback(
    async (licenseKey: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().activate(token, licenseKey);
    },
    [getToken],
  );

  const summon = useCallback(async () => {
    const token = await getToken();
    return RallyApiService.getInstance().summonSpells(token);
  }, [getToken]);

  const cast = useCallback(
    async (
      spellId: string,
      source: SpellSource,
      documentData: SpellDocumentData,
    ) => {
      const token = await getToken();
      return RallyApiService.getInstance().cast(
        token,
        spellId,
        source,
        documentData,
      );
    },
    [getToken],
  );

  const streamCast = useCallback(
    async (
      spellId: string,
      source: SpellSource,
      documentData: SpellDocumentData,
      onReceivedToken: (token: string) => void,
    ) => {
      const token = await getToken();
      return RallyApiService.getInstance().streamCast(
        token,
        spellId,
        source,
        documentData,
        onReceivedToken,
      );
    },
    [getToken],
  );

  const chat = useCallback(
    async (messages: ChatMessage[], document: string, selection: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().chat(
        token,
        messages.filter((message) => typeof message.message === 'string'),
        document,
        selection,
      );
    },
    [getToken],
  );

  const draft = useCallback(
    async (
      directions: string,
      documentData: SpellDocumentData,
      signal?: AbortSignal,
    ) => {
      const token = await getToken();
      return RallyApiService.getInstance().draft(
        token,
        directions,
        documentData,
        signal,
      );
    },
    [getToken],
  );

  const scribeDraft = useCallback(
    async ({
      directions,
      prompt,
      suffix,
      representedParty,
      source,
      signal,
    }: {
      prompt: string;
      suffix: string;
      source: SpellSource;
      directions?: string;
      representedParty?: Party | undefined;
      signal?: AbortSignal;
    }) => {
      const token = await getToken();
      return RallyApiService.getInstance().scribeDraft(
        token,
        directions || '',
        prompt,
        suffix,
        representedParty,
        source,
        signal,
      );
    },
    [getToken],
  );

  const scribeRewrite = useCallback(
    async (messages: ChatMessage[], document: string, source: SpellSource) => {
      const token = await getToken();
      return RallyApiService.getInstance().scribeRewrite(
        token,
        messages,
        document,
        source,
      );
    },
    [getToken],
  );

  const classifyDocument = useCallback(
    async (document: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().classifyDocument(token, document);
    },
    [getToken],
  );

  const calculateEmbeddings = useCallback(
    async (document: string) => {
      const token = await getToken();
      await RallyApiService.getInstance().calculateEmbeddings(token, document);
    },
    [getToken],
  );

  const missingClauses = useCallback(
    async ({
      documentText,
      detailedTerms,
      classification,
      explanation,
      maxClauses,
      previousClauses,
    }: {
      documentText: string;
      detailedTerms?: TermSummary[];
      classification?: string;
      explanation?: string;
      maxClauses?: number;
      previousClauses?: MissingClause[];
    }) => {
      const token = await getToken();
      return RallyApiService.getInstance().missingClauses(
        token,
        documentText,
        detailedTerms,
        classification,
        explanation,
        maxClauses,
        previousClauses,
      );
    },
    [getToken],
  );

  const termSummary = useCallback(
    async (documentText: string, classification?: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().termSummary(
        token,
        documentText,
        classification,
      );
    },
    [getToken],
  );

  const termSummaryConcise = useCallback(
    async (documentText: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().termSummaryConcise(
        token,
        documentText,
      );
    },
    [getToken],
  );

  const woodPurchaseAgreement = useCallback(
    async (documentText: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().woodPurchaseAgreement(
        token,
        documentText,
      );
    },
    [getToken],
  );

  const listParties = useCallback(
    async (documentText: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().listParties(token, documentText);
    },
    [getToken],
  );

  const nonDisclosureAgreementReview = useCallback(
    async (documentText: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().nonDisclosureAgreementReview(
        token,
        documentText,
      );
    },
    [getToken],
  );

  const fetchSpell = useCallback(
    async (spellKey: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().fetchSpell(token, spellKey);
    },
    [getToken],
  );

  const pointsToNegotiate = useCallback(
    async (documentData: SpellDocumentData, source?: SpellSource) => {
      const token = await getToken();
      return RallyApiService.getInstance().pointsToNegotiate(
        token,
        documentData,
        source,
      );
    },
    [getToken],
  );

  const review = useCallback(
    async (documentText: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().review(token, documentText);
    },
    [getToken],
  );

  const reviewStream = useCallback(
    async ({
      documentText,
      representedParty,
      reviewLens = ReviewLens.General,
      instruction,
      includedRevisionTypes,
      onReceived,
      onAborted,
      abortSignal,
    }: {
      documentText: string;
      representedParty?: Party;
      reviewLens?: ReviewLens;
      instruction?: string;
      includedRevisionTypes?: RevisionType[];
      onReceived: (result: ReviewStreamResult) => Promise<void> | void;
      onAborted: () => void;
      abortSignal: AbortSignal;
    }) => {
      const accessToken = await getToken();
      return RallyApiService.getInstance().reviewStream({
        accessToken,
        documentText,
        representedParty,
        reviewLens,
        instruction,
        includedRevisionTypes,
        onReceived,
        onAborted,
        abortSignal,
      });
    },
    [getToken],
  );

  const streamChat = useCallback(
    async (
      messages: ChatMessage[],
      document: string,
      selection: string,
      onReceivedToken: (token: string) => void,
    ) => {
      const token = await getToken();
      return RallyApiService.getInstance().streamChat(
        token,
        messages.filter((message) => typeof message.message === 'string'),
        document,
        selection,
        onReceivedToken,
      );
    },
    [getToken],
  );

  const getPlaybooks = useCallback(async () => {
    const token = await getToken();
    return RallyApiService.getInstance().getPlaybooks(token);
  }, [getToken]);

  const createPlaybook = useCallback(
    async (title: string, instruction: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().createPlaybook(
        token,
        title,
        instruction,
      );
    },
    [getToken],
  );

  const updatePlaybook = useCallback(
    async (playbookId: string, title?: string, instruction?: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().updatePlaybook(
        token,
        playbookId,
        title,
        instruction,
      );
    },
    [getToken],
  );

  const deletePlaybook = useCallback(
    async (playbookId: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().deletePlaybook(token, playbookId);
    },
    [getToken],
  );

  const generatePlaybookTitle = useCallback(
    async (instruction: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().generatePlaybookTitle(
        token,
        instruction,
      );
    },
    [getToken],
  );

  const getDocStores = useCallback(async () => {
    const token = await getToken();
    return RallyApiService.getInstance().getDocStores(token);
  }, [getToken]);

  const createDocStore = useCallback(
    async (name: string, type: DocStoreType) => {
      const token = await getToken();
      return RallyApiService.getInstance().createDocStore(token, name, type);
    },
    [getToken],
  );

  const updateDocStore = useCallback(
    async (docStoreId: string, name?: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().updateDocStore(
        token,
        docStoreId,
        name,
      );
    },
    [getToken],
  );

  const deleteDocStore = useCallback(
    async (docStoreId: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().deleteDocStore(token, docStoreId);
    },
    [getToken],
  );

  const startDocStoreSync = useCallback(
    async (docStoreId: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().startDocStoreSync(token, docStoreId);
    },
    [getToken],
  );

  const getDocStoreSync = useCallback(
    async (docStoreId: string, docStoreSyncId: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().getDocStoreSync(
        token,
        docStoreId,
        docStoreSyncId,
      );
    },
    [getToken],
  );

  const cancelDocStoreSync = useCallback(
    async (docStoreId: string, docStoreSyncId: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().cancelDocStoreSync(
        token,
        docStoreId,
        docStoreSyncId,
      );
    },
    [getToken],
  );

  const createDocStoreFiles = useCallback(
    async (files: FileList, docStoreId: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().uploadDocStoreFiles(
        token,
        files,
        docStoreId,
      );
    },
    [getToken],
  );

  const searchClauses = useCallback(
    async (
      similarityQuery?: SimilarityQuery,
      filter?: ClauseSearchFilter,
      sort?: ClauseSearchSort,
    ) => {
      const token = await getToken();
      return RallyApiService.getInstance().searchClauses(
        token,
        similarityQuery,
        filter,
        sort,
      );
    },
    [getToken],
  );

  const bookmarkClause = useCallback(
    async (clauseId: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().bookmarkClause(token, clauseId);
    },
    [getToken],
  );

  const unbookmarkClause = useCallback(
    async (clauseId: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().unbookmarkClause(token, clauseId);
    },
    [getToken],
  );

  const deleteClause = useCallback(
    async (clauseId: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().deleteClause(token, clauseId);
    },
    [getToken],
  );

  const trackUseClause = useCallback(
    async (clauseId: string) => {
      const token = await getToken();
      return RallyApiService.getInstance().trackUseClause(token, clauseId);
    },
    [getToken],
  );

  return {
    summon,
    getStatus,
    fetchInvitationCount,
    deprecateInvitationCount,
    submitInvitation,
    identify,
    activate,
    cast,
    chat,
    streamCast,
    draft,
    scribeDraft,
    scribeRewrite,
    classifyDocument,
    calculateEmbeddings,
    missingClauses,
    termSummary,
    termSummaryConcise,
    listParties,
    woodPurchaseAgreement,
    nonDisclosureAgreementReview,
    fetchSpell,
    pointsToNegotiate,
    streamChat,
    review,
    reviewStream,
    getPlaybooks,
    createPlaybook,
    updatePlaybook,
    deletePlaybook,
    generatePlaybookTitle,
    getDocStores,
    createDocStore,
    updateDocStore,
    deleteDocStore,
    startDocStoreSync,
    getDocStoreSync,
    cancelDocStoreSync,
    createDocStoreFiles,
    searchClauses,
    bookmarkClause,
    unbookmarkClause,
    deleteClause,
    trackUseClause,
  };
}
