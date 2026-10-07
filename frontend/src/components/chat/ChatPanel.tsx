import { useReducer, useState, useEffect, useRef } from 'react';
import {
  CometChatErrorBoundary,
  CometChatConversations,
  CometChatUsers,
  CometChatGroups,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer,
  CometChatThreadHeader,
  CometChatSearch,
  CometChatGroupMembers,
} from '@cometchat/chat-uikit-react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageSquare, Users, FolderKanban, ArrowLeft, X } from 'lucide-react';

type Tab = 'chats' | 'users' | 'groups';
type Side = 'none' | 'details' | 'thread' | 'search' | 'chat-search';

interface ChatState {
  tab: Tab;
  user?: CometChat.User;
  group?: CometChat.Group;
  conversation?: CometChat.Conversation;
  thread?: CometChat.BaseMessage;
  side: Side;
}

type ChatAction =
  | { t: 'tab'; v: Tab }
  | { t: 'user'; v?: CometChat.User; conv?: CometChat.Conversation }
  | { t: 'group'; v?: CometChat.Group; conv?: CometChat.Conversation }
  | { t: 'thread'; v?: CometChat.BaseMessage }
  | { t: 'side'; v: Side };

function reducer(s: ChatState, a: ChatAction): ChatState {
  switch (a.t) {
    case 'tab':
      return { ...s, tab: a.v };
    case 'user':
      return {
        ...s,
        user: a.v,
        group: undefined,
        conversation: a.conv,
        side: 'none',
        thread: undefined,
      };
    case 'group':
      return {
        ...s,
        group: a.v,
        user: undefined,
        conversation: a.conv,
        side: 'none',
        thread: undefined,
      };
    case 'thread':
      return { ...s, thread: a.v, side: 'thread' };
    case 'side':
      return { ...s, side: a.v };
  }
}

interface ChatPanelProps {
  onClose?: () => void;
  insertedTag?: string | null;
  onClearInsertedTag?: () => void;
  onTagClick?: (tag: string) => void;
}

const TAG_REGEX = /(@(?:[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)?|SL-[A-Z0-9]{4,6}))/g;

function highlightTagsInElement(root: HTMLElement | null) {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (node.parentElement?.classList.contains('slate-tag-chip')) {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.nodeValue && /@[a-zA-Z0-9_-]{2,30}/.test(node.nodeValue)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  const textNodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue || '';
    const parts = text.split(TAG_REGEX);
    if (parts.length > 1) {
      const fragment = document.createDocumentFragment();
      for (const part of parts) {
        if (part.startsWith('@') && part.length > 1) {
          const span = document.createElement('span');
          span.className = 'slate-tag-chip';
          span.textContent = part;
          span.setAttribute('data-tag', part);
          span.setAttribute('title', `Canvas reference: ${part} (Click to locate)`);
          fragment.appendChild(span);
        } else if (part) {
          fragment.appendChild(document.createTextNode(part));
        }
      }
      textNode.parentNode?.replaceChild(fragment, textNode);
    }
  }
}

export function ChatPanel({
  onClose,
  insertedTag,
  onClearInsertedTag,
  onTagClick,
}: ChatPanelProps) {
  const [s, dispatch] = useReducer(reducer, { tab: 'chats', side: 'none' });
  const [composerText, setComposerText] = useState<string>('');
  const messageListContainerRef = useRef<HTMLDivElement>(null);
  const threadListContainerRef = useRef<HTMLDivElement>(null);

  // Handle direct tag insertion into the active composer
  useEffect(() => {
    if (insertedTag) {
      setComposerText((prev) => (prev ? `${prev} ${insertedTag} ` : `${insertedTag} `));
      if (!s.group && !s.user) {
        dispatch({ t: 'tab', v: 'groups' });
      }
      onClearInsertedTag?.();
    }
  }, [insertedTag, onClearInsertedTag, s.group, s.user]);

  const target = s.user ? { user: s.user } : s.group ? { group: s.group } : undefined;
  const hasChat = !!target;

  // Real-time tag highlighter in message lists
  useEffect(() => {
    const mainContainer = messageListContainerRef.current;
    const threadContainer = threadListContainerRef.current;

    const runHighlight = () => {
      if (mainContainer) highlightTagsInElement(mainContainer);
      if (threadContainer) highlightTagsInElement(threadContainer);
    };

    runHighlight();

    const observer = new MutationObserver(() => {
      runHighlight();
    });

    if (mainContainer) {
      observer.observe(mainContainer, { childList: true, subtree: true });
    }
    if (threadContainer) {
      observer.observe(threadContainer, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [target, s.side]);

  // Intercept tag clicks in message lists
  const handleMessageListClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    const chip = el.closest('.slate-tag-chip') as HTMLElement;
    if (chip) {
      const tag = chip.getAttribute('data-tag') || chip.textContent || '';
      if (tag && onTagClick) {
        onTagClick(tag.trim());
      }
      return;
    }

    const text = el.textContent || '';
    const match = text.match(/@[a-zA-Z0-9_-]{2,30}/);
    if (match && onTagClick) {
      onTagClick(match[0].trim());
    }
  };

  const selectorColumn = (
    <aside className="cc-selector-column flex flex-col h-full w-full border-neutral-200 bg-white min-h-0 overflow-hidden">
      {s.side === 'search' ? (
        <div className="h-full w-full flex flex-col min-h-0">
          <CometChatSearch
            onBack={() => dispatch({ t: 'side', v: 'none' })}
            onConversationClicked={(e) => {
              const withEntity = e.conversation.getConversationWith();
              if (withEntity instanceof CometChat.User) {
                dispatch({ t: 'user', v: withEntity, conv: e.conversation });
              } else if (withEntity instanceof CometChat.Group) {
                dispatch({ t: 'group', v: withEntity, conv: e.conversation });
              }
              dispatch({ t: 'side', v: 'none' });
            }}
            onMessageClicked={(_e) => {
              dispatch({ t: 'side', v: 'none' });
            }}
          />
        </div>
      ) : (
        <>
          {/* Header with Compact Tabs */}
          <div className="flex items-center justify-between p-2 border-b border-neutral-200 bg-neutral-50/80 shrink-0">
            <div className="flex items-center gap-0.5 bg-neutral-200/60 p-0.5 rounded-lg">
              <button
                onClick={() => dispatch({ t: 'tab', v: 'chats' })}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  s.tab === 'chats'
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Chats"
              >
                <MessageSquare size={13} />
                <span>Chats</span>
              </button>
              <button
                onClick={() => dispatch({ t: 'tab', v: 'users' })}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  s.tab === 'users'
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Users"
              >
                <Users size={13} />
                <span>Users</span>
              </button>
              <button
                onClick={() => dispatch({ t: 'tab', v: 'groups' })}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  s.tab === 'groups'
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Groups"
              >
                <FolderKanban size={13} />
                <span>Groups</span>
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-md transition-colors"
                title="Close chat"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Tab Content - Kept mounted so live WebSocket events persist */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className={`h-full w-full ${s.tab === 'chats' ? 'block' : 'hidden'}`}>
              <CometChatConversations
                activeConversation={s.conversation}
                onItemClick={(conv) => {
                  const targetEntity = conv.getConversationWith();
                  if (targetEntity instanceof CometChat.User) {
                    dispatch({ t: 'user', v: targetEntity, conv });
                  } else if (targetEntity instanceof CometChat.Group) {
                    dispatch({ t: 'group', v: targetEntity, conv });
                  }
                }}
                showSearchBar={true}
                onSearchBarClicked={() => dispatch({ t: 'side', v: 'search' })}
              />
            </div>

            <div className={`h-full w-full ${s.tab === 'users' ? 'block' : 'hidden'}`}>
              <CometChatUsers
                activeUser={s.user}
                onItemClick={(user) => dispatch({ t: 'user', v: user })}
              />
            </div>

            <div className={`h-full w-full ${s.tab === 'groups' ? 'block' : 'hidden'}`}>
              <CometChatGroups
                activeGroup={s.group}
                onItemClick={(group) => dispatch({ t: 'group', v: group })}
              />
            </div>
          </div>
        </>
      )}
    </aside>
  );

  const messagePane = target && (
    <main
      key={`pane-${s.user?.getUid() || s.group?.getGuid()}`}
      className="cc-message-pane flex flex-col h-full w-full min-w-0 min-h-0 bg-white overflow-hidden"
    >
      <CometChatMessageHeader
        {...target}
        hideBackButton={false}
        onBack={() => dispatch({ t: 'user', v: undefined })}
        showSearchOption={true}
        onSearchOptionClicked={() => dispatch({ t: 'side', v: 'chat-search' })}
        onItemClick={() => dispatch({ t: 'side', v: 'details' })}
      />
      <div
        ref={messageListContainerRef}
        className="flex-1 min-h-0 relative overflow-hidden"
        onClick={handleMessageListClick}
      >
        <CometChatMessageList
          {...target}
          onThreadRepliesClick={(m) => dispatch({ t: 'thread', v: m })}
        />
      </div>
      <CometChatMessageComposer
        {...target}
        text={composerText}
        onTextChange={(val) => setComposerText(val)}
        onSendButtonClick={() => setComposerText('')}
      />
    </main>
  );

  const sidePanel = hasChat && s.side !== 'none' && s.side !== 'search' && (
    <aside className="cc-side-column cc-thread-panel flex flex-col h-full w-full shrink-0 border-neutral-200 bg-white min-h-0 overflow-hidden">
      {s.side === 'thread' && s.thread && (
        <div key={`thread-${s.thread.getId()}`} className="flex flex-col h-full">
          <CometChatThreadHeader
            parentMessage={s.thread}
            onClose={() => dispatch({ t: 'side', v: 'none' })}
          />
          <div
            ref={threadListContainerRef}
            className="flex-1 min-h-0 relative overflow-hidden"
            onClick={handleMessageListClick}
          >
            <CometChatMessageList {...target} parentMessageId={s.thread.getId()} />
          </div>
          <CometChatMessageComposer {...target} parentMessageId={s.thread.getId()} />
        </div>
      )}

      {s.side === 'chat-search' && (
        <CometChatSearch
          uid={s.user?.getUid()}
          guid={s.group?.getGuid()}
          searchIn={['messages']}
          onBack={() => dispatch({ t: 'side', v: 'none' })}
          onMessageClicked={() => {
            dispatch({ t: 'side', v: 'none' });
          }}
        />
      )}

      {s.side === 'details' && s.group && (
        <>
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
            <button
              onClick={() => dispatch({ t: 'side', v: 'none' })}
              className="p-1 hover:bg-neutral-200/70 rounded-md transition-colors text-neutral-600"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className="text-xs font-semibold text-neutral-800">Group Members</h3>
          </div>
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <CometChatGroupMembers
              group={s.group}
              onBack={() => dispatch({ t: 'side', v: 'none' })}
            />
          </div>
        </>
      )}

      {s.side === 'details' && s.user && (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
            <h3 className="text-xs font-semibold text-neutral-800">User Details</h3>
            <button
              onClick={() => dispatch({ t: 'side', v: 'none' })}
              className="p-1 hover:bg-neutral-200/70 rounded-md transition-colors text-neutral-600 text-xs"
            >
              Close
            </button>
          </div>
          <div className="p-4 flex flex-col items-center text-center">
            {s.user.getAvatar() ? (
              <img
                src={s.user.getAvatar()}
                alt={s.user.getName()}
                className="w-14 h-14 rounded-full mb-2.5 object-cover shadow-xs border border-neutral-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold mb-2.5">
                {s.user.getName()?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <h4 className="font-semibold text-sm text-neutral-900">{s.user.getName()}</h4>
            <span className="text-[11px] text-neutral-500 font-mono mt-0.5">{s.user.getUid()}</span>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  s.user.getStatus() === 'online' ? 'bg-green-500' : 'bg-neutral-300'
                }`}
              />
              <span className="capitalize">{s.user.getStatus() || 'Offline'}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <CometChatErrorBoundary>
      <div className="cc-app h-full w-full flex flex-col overflow-hidden select-none bg-white">
        {!hasChat && selectorColumn}
        {hasChat && s.side !== 'none' && sidePanel}
        {hasChat && s.side === 'none' && messagePane}
      </div>
    </CometChatErrorBoundary>
  );
}
