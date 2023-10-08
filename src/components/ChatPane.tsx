import './styles/chatpane.css';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { RefObject, ReactNode } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faArrowUpToLine } from '@fortawesome/pro-regular-svg-icons';
import {
  faSparkles,
  faWandMagicSparkles,
} from '@fortawesome/pro-light-svg-icons';
import { toast } from 'react-toastify';
import { useThrottledCallback } from 'use-debounce';

import { useSpellbook } from '../contexts/SpellbookContext';
import { BORDER, CHAT_BUBBLE, COLORS } from './Styles';
import { ChatMessage, MessageType } from '../types/ChatMessage';
import { handleException } from '../utils/ErrorUtils';
import { fakCopy } from '../icons/fakSpellIcons';
import { copyToClipboard } from '../utils/ClipboardUtils';
import { BasicTooltip } from './tooltip/Tooltip';

function ChatBubbleAnimation({
  children,
  scrollToBottom,
  ...props
}: {
  children: ReactNode;
  scrollToBottom: () => void;
}) {
  return (
    <CSSTransition
      classNames="chat-bubble-animation"
      timeout={{ enter: 500, exit: 0 }}
      onEnter={() => {
        scrollToBottom();
      }}
      onEntered={() => {
        scrollToBottom();
      }}
      {...props}
    >
      {children}
    </CSSTransition>
  );
}

function ChatBubble({
  chatMessage,
  chatPaneRef,
  ...props
}: {
  chatMessage: ChatMessage;
  chatPaneRef: RefObject<HTMLDivElement>;
}) {
  const {
    message,
    messageType,
    author: { isUser },
    isCast,
    isCasting,
  } = chatMessage;
  const ref = useRef<HTMLDivElement>(null);

  const isTall =
    ref.current &&
    chatPaneRef.current &&
    ref.current.offsetHeight > chatPaneRef.current.clientHeight;

  const scrollToTopOfMessage = useCallback(() => {
    ref.current?.scrollIntoView({ block: 'start' });
  }, []);

  const enableMessageCopy =
    messageType === MessageType.SPELL_RESULT ||
    messageType === MessageType.ASSISTANT_RESPONSE;

  const bubbleColor = isUser ? COLORS.BLUE : COLORS.GRAY;
  let textColor = COLORS.BLACK;
  if (isUser) {
    textColor = COLORS.WHITE;
  }

  return (
    <div
      className="my-2"
      style={{
        alignSelf: isUser ? 'end' : 'start',
        marginLeft: isUser ? 'auto' : 0,
        padding: CHAT_BUBBLE.PADDING,
        borderRadius: BORDER.RADIUS,
        maxWidth: '75%',
        background: bubbleColor,
        color: textColor,
        whiteSpace: 'pre-line',
      }}
      ref={ref}
      {...props}
    >
      {isCast && (
        <FontAwesomeIcon icon={faSparkles} style={{ marginRight: '8px' }} />
      )}
      {message}
      {isCasting && (
        <FontAwesomeIcon
          beatFade
          icon={faWandMagicSparkles}
          style={{ marginLeft: '8px' }}
        />
      )}
      <div className="mr-[-5px] flex justify-end">
        {enableMessageCopy && (
          <BasicTooltip tooltip="Copy">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded p-[6px] hover:bg-gray-5"
              onClick={async () => {
                try {
                  if (typeof message !== 'string' && message?.props) {
                    const formattedMessage = await message?.props?.children
                      .map(
                        (
                          {
                            props: { name, summary },
                          }: {
                            props: { name: string; summary: string };
                          },
                          i: number,
                        ) =>
                          `${name}\n${summary}${
                            i < message.props.children.length - 1 ? '\n\n' : ''
                          }`,
                      )
                      .join('');
                    await copyToClipboard(formattedMessage);
                  } else {
                    await copyToClipboard(message.toString());
                  }
                  toast.success('Message copied to clipboard');
                } catch (error) {
                  handleException(error);
                  toast.error('Unable to copy message');
                }
              }}
            >
              <FontAwesomeIcon
                className="text-sm text-gray-2 hover:text-gray-1"
                icon={fakCopy as IconProp}
              />
            </button>
          </BasicTooltip>
        )}
        {isTall && (
          <BasicTooltip tooltip="Jump to Top">
            <button
              type="button"
              onClick={scrollToTopOfMessage}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded p-[6px] hover:bg-gray-5"
            >
              <FontAwesomeIcon
                className="text-sm text-gray-2 hover:text-gray-1"
                icon={faArrowUpToLine}
              />
            </button>
          </BasicTooltip>
        )}
      </div>
    </div>
  );
}

export function ChatPane() {
  const { messages, chatAction } = useSpellbook();
  const ref = useRef<HTMLDivElement>(null);
  const isCasting = !!messages.find((m: ChatMessage) => m.isCasting);

  const lastMessage = useMemo(() => messages[messages.length - 1], [messages]);

  const scrollToBottom = useThrottledCallback(() => {
    ref.current?.scrollTo({
      top: ref.current.scrollHeight,
      behavior: 'smooth',
    });
  }, 50);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const { scrollTop, clientHeight, scrollHeight } = ref.current;
    const remainingScroll = Math.abs(scrollHeight - clientHeight - scrollTop);

    if (remainingScroll < 40) {
      scrollToBottom();
    }
  }, [lastMessage, scrollToBottom]);

  return (
    <div
      className="scrollbar-hide"
      style={{
        overflowY: 'auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
      }}
      ref={ref}
    >
      <TransitionGroup
        style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}
      >
        {messages.map((chatMessage) => (
          <ChatBubbleAnimation
            key={chatMessage.key}
            scrollToBottom={scrollToBottom}
          >
            {chatMessage.noBubble ? (
              chatMessage.message
            ) : (
              <ChatBubble chatMessage={chatMessage} chatPaneRef={ref} />
            )}
          </ChatBubbleAnimation>
        ))}
        {chatAction && !isCasting && (
          <ChatBubbleAnimation
            key="chat-action"
            scrollToBottom={scrollToBottom}
          >
            {chatAction}
          </ChatBubbleAnimation>
        )}
      </TransitionGroup>
    </div>
  );
}
