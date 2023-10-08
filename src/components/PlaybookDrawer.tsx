import { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Plus } from '@phosphor-icons/react';
import { Drawer } from './Drawer';
import { usePlaybook } from '../contexts/PlaybookContext';
import { PlaybookCard } from './PlaybookCard';
import DebouncedSearchBar from './DebouncedSearchBar';
import { LoadingSpinner } from './LoadingSpinner';
import { useAnalytics } from '../contexts/AnalyticsContext';

export function PlaybookDrawer({
  defaultOpen, // add defaultOpen prop for rendering in storybook
}: {
  defaultOpen?: boolean;
}) {
  const { trackEvent } = useAnalytics();
  const {
    playbooks,
    isPlaybookDrawerOpen: isOpen,
    setIsPlaybookDrawerOpen: setIsOpen,
    createPlaybook,
    isCreatingPlaybook,
  } = usePlaybook();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const isDrawerOpen = isOpen || defaultOpen;

  const handleAddClick = () => {
    trackEvent('Added Playbook');
    createPlaybook('New Playbook', '');
  };

  return (
    <Drawer isOpen={!!isDrawerOpen} setIsOpen={setIsOpen} title="Playbooks">
      <div className="flex h-full flex-col space-y-4 overflow-y-auto px-2 pb-[5vh]">
        <DebouncedSearchBar
          placeholder="Find by name"
          setSearchQuery={setSearchQuery}
          searchQuery={searchQuery}
        />
        <div className="flex items-center justify-between">
          <p className="text-gray-2">
            {playbooks?.length === 0 ? 'No' : playbooks.length} Playbook
            {playbooks?.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            className="flex items-center rounded-md bg-purple-2 px-3 py-1 text-sm font-bold text-purple-3"
            onClick={handleAddClick}
          >
            <span className="mr-1 inline-block">
              {isCreatingPlaybook ? (
                <LoadingSpinner variant="small" color="#4D69F9" />
              ) : (
                <Plus size={15} weight="bold" />
              )}
            </span>
            Add
          </button>
        </div>
        <hr className="my-4 block h-[0.5] w-full bg-gray-6" />
        <div className="space-y-4 pb-5">
          <TransitionGroup component={null}>
            {playbooks
              ?.filter((playbook) =>
                playbook.title
                  .toLowerCase()
                  .trim()
                  .includes(searchQuery.toLowerCase().trim()),
              )
              .map(({ _id: id, title, parameters: { instruction } }) => (
                <CSSTransition
                  key={id}
                  classNames="fadescale fadescale-slide"
                  timeout={300}
                >
                  <PlaybookCard
                    key={id}
                    id={id}
                    title={title}
                    instruction={instruction}
                    setIsOpen={setIsOpen}
                  />
                </CSSTransition>
              ))}
          </TransitionGroup>
        </div>
      </div>
    </Drawer>
  );
}
