import {
  createContext,
  Dispatch,
  ReactElement,
  ReactNode,
  Reducer,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import type { ChatMessage } from '../types/ChatMessage';
import { MessageType } from '../types/ChatMessage';
import type { MessageAction } from '../types/MessageAction';
import { MessageActionEnum } from '../types/MessageAction';
import { SpellPromptCollector } from '../common/SpellPromptCollector';
import { Spell } from '../services/RallyApiService';
import { SpellOption } from '../common/SpellOption';
import { DocumentService } from '../services/DocumentService';
import { SpellbookError } from '../common/SpellbookError';

export type MessageCompletionState = { messages: ChatMessage[] };

export type LastSpellType = {
  recastLastSpell?: () => void;
  lastSpellName?: string;
};

export type SpellbookContextType = {
  messages: ChatMessage[];
  messageDispatch: Dispatch<MessageAction>;
  recastLastSpell?: () => void;
  lastSpellName?: string;
  setLastSpell: Dispatch<
    SetStateAction<{
      recastLastSpell?: () => void | Promise<void>;
      lastSpellName?: string;
    }>
  >;
  setDebugEnabled: Dispatch<SetStateAction<boolean>>;
  isDebugEnabled: boolean;
  chatAction?: ReactElement | null;
  setChatAction: Dispatch<ReactElement | null>;
  boxValue: string;
  setBoxValue: Dispatch<SetStateAction<string>>;
  promptCollector: SpellPromptCollector | null;
  setPromptCollector: Dispatch<SetStateAction<SpellPromptCollector | null>>;
  isSummoningComplete: boolean;
  setIsSummoningComplete: Dispatch<SetStateAction<boolean>>;
  summonedSpells: Spell[];
  setSummonedSpells: Dispatch<SetStateAction<Spell[]>>;
  spells: SpellOption[];
  setSpells: Dispatch<SetStateAction<SpellOption[]>>;
};

const SpellbookContext = createContext<SpellbookContextType | undefined>(
  undefined,
);

export function SpellbookProvider({ children }: { children: ReactNode }) {
  const [{ recastLastSpell, lastSpellName }, setLastSpell] = useState<{
    recastLastSpell?: () => void;
    lastSpellName?: string;
  }>({});

  const [chatAction, setChatAction] = useState<ReactElement | null>(null);
  const [isDebugEnabled, setDebugEnabled] = useState(false);
  const [boxValue, setBoxValue] = useState('');
  const [promptCollector, setPromptCollector] =
    useState<SpellPromptCollector | null>(null);
  const [isSummoningComplete, setIsSummoningComplete] =
    useState<boolean>(false);
  const [summonedSpells, setSummonedSpells] = useState<Spell[]>([]);
  const [spells, setSpells] = useState<SpellOption[]>([]);

  useEffect(() => {
    const removeHandlerPromise =
      DocumentService.persistDocumentSpellbookState();
    return () => {
      removeHandlerPromise.then((removeHandler) => removeHandler());
    };
  }, []);

  const messageReducer: Reducer<MessageCompletionState, MessageAction> = (
    { messages },
    action,
  ) => {
    switch (action.type) {
      case MessageActionEnum.INSERT: {
        return { messages: [...messages, action.message] };
      }
      case MessageActionEnum.REPLACE: {
        return {
          messages: messages.map((message) =>
            message.key === action.message.key ? action.message : message,
          ),
        };
      }
      case MessageActionEnum.UPDATE:
        return {
          messages: messages.map((message) =>
            message.key === action.update.key
              ? { ...message, ...action.update }
              : message,
          ),
        };
      default: {
        // @ts-ignore
        throw new SpellbookError(`unknown action ${action.type}`);
      }
    }
  };

  const [{ messages }, messageDispatch] = useReducer(messageReducer, {
    messages: [
      {
        message:
          'Hi there! I’m Spellbook, your AI legal assistant. Click the diamond to select a spell or ask me a question about your contract.',
        messageType: MessageType.PROCESSING,
        author: { isUser: false, name: 'Spellbook' },
        key: 'welcome-message',
      },
    ],
  });

  const value = useMemo(
    () => ({
      messages,
      messageDispatch,
      recastLastSpell,
      lastSpellName,
      setLastSpell,
      isDebugEnabled,
      setDebugEnabled,
      chatAction,
      setChatAction,
      boxValue,
      setBoxValue,
      promptCollector,
      setPromptCollector,
      isSummoningComplete,
      setIsSummoningComplete,
      summonedSpells,
      setSummonedSpells,
      spells,
      setSpells,
    }),
    [
      boxValue,
      chatAction,
      isDebugEnabled,
      isSummoningComplete,
      lastSpellName,
      messages,
      promptCollector,
      recastLastSpell,
      spells,
      summonedSpells,
    ],
  );

  return (
    <SpellbookContext.Provider value={value}>
      {children}
    </SpellbookContext.Provider>
  );
}

export function useSpellbook(): SpellbookContextType {
  const context = useContext(SpellbookContext);
  if (context === undefined) {
    throw new Error('useSpellbook must be used within a SpellbookProvider');
  }

  return context;
}
