import axios, { AxiosInstance } from 'axios';

import { diffText } from '../utils/diffText';
import { SpellSource } from '../common/SpellSource';
import { ChatMessage } from '../types/ChatMessage';
import { Party } from '../types/Party';
import { getMessages, getStreamText, StreamService } from './StreamService';
import type { ReviewItem } from '../types/ReviewItem';
import { ReviewLens } from '../types/ReviewLens';
import { withRetry } from '../utils/withRetry';

export type SpellCategory = {
  _id: string;
  name: string;
  icon?: string;
};

export enum SpellTag {
  alpha = 'alpha',
  beta = 'beta',
  new = 'new',
  development = 'development',
  custom = 'custom',
}

export enum SpellAccepts {
  selection = 'selection',
  beginning = 'beginning',
  eightPageWindow = 'eightPageWindow',
  full = 'full',
  termSummary = 'termSummary',
  classification = 'classification',
  parties = 'parties',
  representedParty = 'representedParty',
}

export type SpellDocumentData = {
  [key in SpellAccepts]?: string;
};

export type Spell = {
  _id: string;
  key?: string;
  name: string;
  helpText?: string;
  categories?: SpellCategory[];
  icon?: string;
  tags?: SpellTag[];
  accepts?: SpellAccepts[];
};

type CompletionResult = {
  completion: string;
};

export type DraftResult = {
  completion: string;
  finished: boolean;
  id: string;
  pinned?: boolean;
  loading?: boolean;
  placeholder?: boolean;
  dismissed?: boolean;
};

export type PointsToNegotiateResult = {
  name: string;
  reason: string;
}[];

export enum RevisionType {
  modification = 'modification',
  comment = 'comment',
}

export enum ReviewScope {
  document = 'Full Document',
  selection = 'Selected Text',
}

export type ReviewItemResult =
  | {
      id: string;
      name: string;
      paragraph: string;
      description: string;
      type: RevisionType.comment;
      text: string;
    }
  | {
      id: string;
      name: string;
      paragraph: string;
      description: string;
      type: RevisionType.modification;
      text: string;
      reason: string;
    };

type ClassificationResult = {
  classification: string;
};

export type TermSummary = {
  id: string;
  name: string;
  type: string;
  summary: string;
  source?: string;
};

export type TermSummaryResponse = {
  terms: TermSummary[];
};

export type MissingClause = {
  name: string;
  summary: string;
  prompt: string;
};

export type MissingClauseResponse = {
  clauses: MissingClause[];
};

type SpellsResult = { spells: Spell[] };

type ChatResult = { message: ChatMessage };

export type ReviewStreamResult = {
  progress?: number;
  done: boolean;
  reviewItems: ReviewItemResult[];
};

export enum SpellbookUserStatus {
  UNKNOWN = 'UNKNOWN',
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  BLOCKED = 'BLOCKED',
}

export type SpellbookUser = {
  status: SpellbookUserStatus;
  hasAccess: boolean;
  validated: boolean;
  licenseTags: string[];
  licenseEntitlements: string[];
  licenseStatus: string;
  trialEndTime?: number;
};

export type Playbook = {
  _id: string;
  title: string;
  parameters: {
    type: string;
    instruction: string;
  };
  owners: { type: string; id: string }[];
};

export type DocStore = {
  _id: string;
  name: string;
  documentStoreType: DocStoreType;
  numberOfDocuments: number;
  docStoreSync: DocStoreSync;
  lastSyncedAt: string;
};

export enum DocStoreType {
  SPELLBOOK = 'SPELLBOOK',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  ONE_DRIVE = 'ONE_DRIVE',
  DROPBOX = 'DROPBOX',
}

export type DocStoreSync = {
  _id: string;
  createdAt: string;
  documentStore: string;
  fileUrls: string[];
  numProcessed: number;
  pipelineVersion: string;
  prune: boolean;
  startedAt: string;
  status: DocStoreSyncStatus;
};

export enum DocStoreSyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type Clause = {
  _id: string;
  title: string; // Brief title of the clause
  text: string; // Scrubbed/Anonymized text of the clause
  similarity: number; // Cosine similarity of the clause to the search text
};

export type ClauseMetadata = {
  isBookmark: boolean;
  lastUsedAt: string;
  usageCount: number;
  numDocuments: number;
};

export type ClauseSearchResponseItem = {
  clause: Clause;
  userClauseData: ClauseMetadata;
};

export enum ClauseSearchSortType {
  NUM_OCCURRENCES = 'NUM_OCCURRENCES',
  FREQUENCY = 'FREQUENCY',
  RECENTLY_USED = 'RECENTLY_USED',
}

export enum ClauseSearchSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum ClauseSearchFieldOption {
  TEXT = 'TEXT',
  TITLE = 'TITLE',
}

export type ClauseSearchFilter = {
  docStoreIds: string[];
  documentIds: string[];
};

export type ClauseSearchSort = {
  type: ClauseSearchSortType;
  order: ClauseSearchSortOrder;
};

export type SimilarityQuery = {
  query: string;
  field: ClauseSearchFieldOption;
};

type SpellbookUserResponse = {
  spellbookUser: SpellbookUser;
};

type SpellbookInvitationCountResponse = {
  count: number;
};

type InviteResponse = {
  inviteSubmitted: boolean;
};

type ActivateResponse = {
  activated: boolean;
};

export class RallyApiService {
  private static instance: RallyApiService;

  private readonly axiosInstance: AxiosInstance;

  private readonly streamServiceInstance: StreamService;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: `https://${import.meta.env.VITE_API_HOST}/`,
      timeout: 121000, // 1s more than the ALB idle timeout
    });
    this.streamServiceInstance = new StreamService({
      baseUrl: `https://${import.meta.env.VITE_API_HOST}/`,
    });
  }

  public static getInstance(): RallyApiService {
    if (!RallyApiService.instance) {
      RallyApiService.instance = new RallyApiService();
    }

    return RallyApiService.instance;
  }

  public async status() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.get('spellbook/v1/status', {
      headers,
    });
    return response.data;
  }

  public async fetchInvitationCount(accessToken: string): Promise<number> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response =
      await this.axiosInstance.get<SpellbookInvitationCountResponse>(
        'spellbook/v1/invitations/count',
        { headers },
      );
    return response.data.count;
  }

  public async deprecateInvitationCount(accessToken: string): Promise<number> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response =
      await this.axiosInstance.post<SpellbookInvitationCountResponse>(
        'spellbook/v1/invitations/decrement',
        {},
        { headers },
      );
    return response.data.count;
  }

  public async submitInvitation(
    accessToken: string,
    email: string,
    name: string,
    isSameOrganization: boolean,
    inviterEmail: string,
    inviterName: string,
  ): Promise<InviteResponse> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.post<InviteResponse>(
      'spellbook/v1/invitations/submit',
      { email, name, isSameOrganization, inviterEmail, inviterName },
      { headers },
    );
    return response.data;
  }

  public async identify(accessToken: string): Promise<SpellbookUser> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.post<SpellbookUserResponse>(
      'spellbook/v1/identify',
      {},
      { headers },
    );
    return response.data.spellbookUser;
  }

  public async activate(
    accessToken: string,
    licenseKey: string,
  ): Promise<ActivateResponse> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.post<ActivateResponse>(
      'spellbook/v1/activate',
      { licenseKey },
      { headers },
    );
    return response.data;
  }

  public async cast(
    accessToken: string,
    spellId: string,
    source: SpellSource,
    documentData: SpellDocumentData,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.post<CompletionResult>(
      'spellbook/v1/cast',
      { spellId, source, documentData },
      { headers },
    );

    return response.data.completion;
  }

  public async streamCast(
    accessToken: string,
    spellId: string,
    source: SpellSource,
    documentData: SpellDocumentData,
    onReceivedToken: (token: string) => void,
  ): Promise<void> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await this.streamServiceInstance.post(
      `/spellbook/v1/cast`,
      {
        spellId,
        source,
        documentData,
      },
      { headers },
    );

    for await (const { data } of getMessages(response)) {
      if (data) {
        onReceivedToken(getStreamText(data));
      }
    }
  }

  public async summonSpells(accessToken: string): Promise<SpellsResult> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.get<SpellsResult>(
      'spellbook/v1/spells',
      { headers },
    );

    return response.data;
  }

  public async chat(
    accessToken: string,
    messages: ChatMessage[],
    document: string,
    selection: string,
  ): Promise<ChatMessage> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<ChatResult>(
      'spellbook/v1/chat',
      { messages, document, selection },
      {
        headers,
      },
    );

    return response.data.message;
  }

  public async draft(
    accessToken: string,
    directions: string,
    documentData: SpellDocumentData,
    signal?: AbortSignal,
  ): Promise<DraftResult> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<DraftResult>(
      'spellbook/v1/draft',
      {
        directions,
        documentData,
      },
      { headers, signal },
    );

    return response.data;
  }

  public async scribeDraft(
    accessToken: string,
    directions: string,
    prompt: string,
    suffix: string,
    representedParty: Party | undefined,
    source: SpellSource,
    signal?: AbortSignal,
  ): Promise<DraftResult> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<DraftResult>(
      'spellbook/v1/scribeDraft',
      {
        directions,
        prompt,
        suffix,
        source,
        representedParty,
      },
      { headers, signal },
    );

    return response.data;
  }

  public async scribeRewrite(
    accessToken: string,
    messages: ChatMessage[],
    document: string,
    source: SpellSource,
  ): Promise<string> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<CompletionResult>(
      'spellbook/v1/scribeRewrite',
      { messages, document, source },
      { headers },
    );

    return response.data.completion;
  }

  public async calculateEmbeddings(
    accessToken: string,
    document: string,
  ): Promise<string> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<CompletionResult>(
      'spellbook/v1/calculateEmbeddings',
      { document },
      { headers },
    );

    return response.data.completion;
  }

  public async classifyDocument(
    accessToken: string,
    document: string,
  ): Promise<string> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<ClassificationResult>(
      'spellbook/v1/classifyDocument',
      { document },
      { headers },
    );

    return response.data.classification;
  }

  public async missingClauses(
    accessToken: string,
    documentText: string,
    detailedTerms?: TermSummary[],
    classification?: string,
    explanation?: string,
    maxClauses?: number,
    previousClauses?: MissingClause[],
  ): Promise<MissingClauseResponse> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await withRetry(() =>
      this.axiosInstance.post<MissingClauseResponse>(
        'spellbook/v1/missingClausesJson',
        {
          documentText,
          detailedTerms,
          classification,
          explanation,
          maxClauses,
          previousClauses,
        },
        {
          headers,
        },
      ),
    );

    return response.data;
  }

  public async termSummary(
    accessToken: string,
    documentText: string,
    classification?: string,
  ): Promise<TermSummaryResponse> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<TermSummaryResponse>(
      'spellbook/v1/termSummary',
      { documentText, classification },
      {
        headers,
      },
    );

    return response.data;
  }

  public async termSummaryConcise(
    accessToken: string,
    documentText: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<any>(
      'spellbook/v1/termSummaryConcise',
      { documentText },
      { headers },
    );

    return response.data;
  }

  public async woodPurchaseAgreement(
    accessToken: string,
    documentText: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.post<{
      responses: { _id: string; name: string; response: string }[];
    }>(
      'spellbook/v1/woodPurchaseAgreement',
      { documentText, source: SpellSource.SpellSelector },
      { headers },
    );

    return response.data;
  }

  public async listParties(
    accessToken: string,
    documentText: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await withRetry(() =>
      this.axiosInstance.post<any>(
        'spellbook/v1/listParties',
        { documentText },
        { headers },
      ),
    );

    return response.data;
  }

  public async nonDisclosureAgreementReview(
    accessToken: string,
    documentText: string,
  ) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.post<{
      responses: { _id: string; name: string; response: string }[];
    }>(
      'spellbook/v1/nonDisclosureAgreementReview',
      { documentText, source: SpellSource.SpellSelector },
      { headers },
    );

    return response.data;
  }

  public async fetchSpell(accessToken: string, spellKey: string) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.get<Spell>(
      `spellbook/v1/spells/${spellKey}`,
      { headers },
    );

    return response.data;
  }

  public async pointsToNegotiate(
    accessToken: string,
    documentData: SpellDocumentData,
    source?: SpellSource,
  ): Promise<PointsToNegotiateResult> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await withRetry(() =>
      this.axiosInstance.post<PointsToNegotiateResult>(
        'spellbook/v1/pointsToNegotiate',
        {
          documentData,
          source,
        },
        { headers },
      ),
    );

    return response.data;
  }

  public async review(
    accessToken: string,
    documentText: string,
  ): Promise<ReviewItem[]> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<ReviewItemResult[]>(
      'spellbook/v1/review',
      {
        documentText,
      },
      { headers },
    );

    return response.data.map((item) => {
      if (item.type === RevisionType.modification) {
        return { ...item, diff: diffText(item.paragraph, item.text) };
      }

      return item;
    });
  }

  public async reviewStream({
    accessToken,
    documentText,
    representedParty,
    reviewLens,
    instruction,
    includedRevisionTypes,
    onReceived,
    onAborted,
    abortSignal,
  }: {
    accessToken: string;
    documentText: string;
    representedParty?: Party;
    reviewLens?: ReviewLens;
    instruction?: string;
    includedRevisionTypes?: RevisionType[];
    onReceived: (result: ReviewStreamResult) => Promise<void> | void;
    onAborted: () => void;
    abortSignal: AbortSignal;
  }) {
    try {
      const response = await this.streamServiceInstance.post(
        `/spellbook/v1/reviewStream`,
        {
          documentText,
          representedParty,
          reviewLens,
          instruction,
          includedRevisionTypes,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          abortSignal,
        },
      );

      for await (const { data } of getMessages(response)) {
        if (data) {
          const result = JSON.parse(data.replace(/^data:\s*/i, ''));
          await onReceived(result);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError' && onAborted) {
        onAborted();
      } else {
        throw error;
      }
    }
  }

  public async streamChat(
    accessToken: string,
    messages: ChatMessage[],
    document: string,
    selection: string,
    onReceivedToken: (token: string) => void,
  ) {
    const response = await this.streamServiceInstance.post(
      `/spellbook/v1/chat`,
      {
        messages,
        document,
        selection,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    for await (const { data } of getMessages(response)) {
      if (data) {
        onReceivedToken(getStreamText(data));
      }
    }
  }

  public async getPlaybooks(accessToken: string): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.get<any>(
      `spellbook/v1/playbooks`,
      { headers },
    );

    return response.data;
  }

  public async createPlaybook(
    accessToken: string,
    title: string,
    instruction: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.post<any>(
      `spellbook/v1/playbooks`,
      { title, instruction },
      { headers },
    );

    return response.data;
  }

  public async updatePlaybook(
    accessToken: string,
    playbookId: string,
    title?: string,
    instruction?: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.put<any>(
      `spellbook/v1/playbooks/${playbookId}`,
      { title, instruction },
      { headers },
    );

    return response.data;
  }

  public async deletePlaybook(
    accessToken: string,
    playbookId: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.delete<any>(
      `spellbook/v1/playbooks/${playbookId}`,
      { headers },
    );

    return response.data;
  }

  public async generatePlaybookTitle(
    accessToken: string,
    instruction: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.post<string>(
      `spellbook/v1/playbooks/title`,
      { instruction },
      { headers },
    );

    return response.data;
  }

  public async getDocStores(accessToken: string): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.get<any>(
      `spellbook/v1/clauseLibrary/documentStore`,
      { headers },
    );

    return response.data;
  }

  public async createDocStore(
    accessToken: string,
    name: string,
    type: DocStoreType,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<any>(
      `spellbook/v1/clauseLibrary/documentStore`,
      { name, documentStoreType: type },
      { headers },
    );

    return response.data;
  }

  public async updateDocStore(
    accessToken: string,
    docStoreId: string,
    name?: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.put<any>(
      `spellbook/v1/clauseLibrary/documentStore/${docStoreId}`,
      { name },
      { headers },
    );

    return response.data;
  }

  public async deleteDocStore(
    accessToken: string,
    docStoreId: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.delete<any>(
      `spellbook/v1/clauseLibrary/documentStore/${docStoreId}`,
      { headers },
    );

    return response.data;
  }

  public async startDocStoreSync(
    accessToken: string,
    docStoreId: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<any>(
      `spellbook/v1/clauseLibrary/documentStore/${docStoreId}/sync`,
      {},
      { headers },
    );

    return response.data;
  }

  public async getDocStoreSync(
    accessToken: string,
    docStoreId: string,
    docStoreSyncId: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.get<any>(
      `spellbook/v1/clauseLibrary/documentStore/${docStoreId}/sync/${docStoreSyncId}`,
      { headers },
    );

    return response.data;
  }

  public async cancelDocStoreSync(
    accessToken: string,
    docStoreId: string,
    docStoreSyncId: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.delete<any>(
      `spellbook/v1/clauseLibrary/documentStore/${docStoreId}/sync/${docStoreSyncId}`,
      { headers },
    );

    return response.data;
  }

  public async uploadDocStoreFiles(
    accessToken: string,
    files: FileList,
    docStoreId: string,
  ): Promise<any> {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append('file', file);
    });

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    };

    const response = await this.axiosInstance.post<any>(
      `spellbook/v1/clauseLibrary/documentStore/${docStoreId}/upload`,
      formData,
      { headers },
    );

    return response.data;
  }

  public async searchClauses(
    accessToken: string,
    similarityQuery?: SimilarityQuery,
    filter?: ClauseSearchFilter,
    sort?: ClauseSearchSort,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await this.axiosInstance.post<any>(
      `spellbook/v1/clauseLibrary/clause/search`,
      { similarityQuery, filter, sort },
      { headers },
    );

    return response.data;
  }

  public async bookmarkClause(
    accessToken: string,
    clauseId: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.post<any>(
      `spellbook/v1/clauseLibrary/clause/${clauseId}/bookmark`,
      {},
      { headers },
    );

    return response.data;
  }

  public async unbookmarkClause(
    accessToken: string,
    clauseId: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.delete<any>(
      `spellbook/v1/clauseLibrary/clause/${clauseId}/bookmark`,
      { headers },
    );

    return response.data;
  }

  public async deleteClause(
    accessToken: string,
    clauseId: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.delete<any>(
      `spellbook/v1/clauseLibrary/clause/${clauseId}`,
      { headers },
    );

    return response.data;
  }

  public async trackUseClause(
    accessToken: string,
    clauseId: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const response = await this.axiosInstance.post<any>(
      `spellbook/v1/clauseLibrary/clause/${clauseId}/trackUse`,
      {},
      { headers },
    );

    return response.data;
  }
}
